import dotenv from 'dotenv'
dotenv.config()
import mongoose from 'mongoose'
import { ApolloServer, gql } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { GraphQLError } from 'graphql'
import jwt from 'jsonwebtoken'
import process from 'process'

import Author from './models/author.js'
import Book   from './models/book.js'
import User   from './models/user.js'

mongoose.set('strictQuery', false)
const MONGODB_URI = process.env.MONGODB_URI
console.log('connecting to', MONGODB_URI)

mongoose.connect(MONGODB_URI)
  .then(() => console.log('connected to MongoDB'))
  .catch((error) => console.error('connection error:', error.message))

const typeDefs = gql`
  type Author {
    name: String!
    born: Int
    id: ID!
    bookCount: Int!
  }

  type Book {
    title: String!
    published: Int!
    author: Author!
    genres: [String!]!
    id: ID!
  }

  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
    me: User
  }

  type Mutation {
    addBook(
      title: String!
      author: String!
      published: Int!
      genres: [String!]!
    ): Book!
    editAuthor(
      name: String!
      setBornTo: Int!
    ): Author
    createUser(
      username: String!
      favoriteGenre: String!
    ): User
    login(
      username: String!
      password: String!
    ): Token
  }
`

const resolvers = {
  Query: {
    bookCount:   () => Book.countDocuments(),
    authorCount: () => Author.countDocuments(),
    allBooks: async (root, args) => {
      const filter = {}
      if (args.author) {
        const auth = await Author.findOne({ name: args.author })
        if (!auth) return []
        filter.author = auth._id
      }
      if (args.genre) {
        filter.genres = { $in: [args.genre] }
      }
      return Book.find(filter).populate('author')
    },
    allAuthors: () => Author.find({}),
    me: (root, args, context) => {
      return context.currentUser
    }
  },

  Mutation: {
    addBook: async (root, args, context) => {
      if (!context.currentUser) {
        throw new GraphQLError('not authenticated', { extensions: { code: 'UNAUTHENTICATED' } })
      }
      let authDoc = await Author.findOne({ name: args.author })
      if (!authDoc) {
        authDoc = new Author({ name: args.author })
        try {
          await authDoc.save()
        } catch (error) {
          throw new GraphQLError('Saving author failed: ' + error.message, {
            extensions: { code: 'BAD_USER_INPUT', invalidArgs: args.author, error }
          })
        }
      }

      const book = new Book({
        title:     args.title,
        published: args.published,
        genres:    args.genres,
        author:    authDoc._id,
      })
      try {
        await book.save()
      } catch (error) {
        throw new GraphQLError('Saving book failed: ' + error.message, {
          extensions: { code: 'BAD_USER_INPUT', invalidArgs: args.title, error }
        })
      }
      return book.populate('author')
    },

    editAuthor: async (root, args, context) => {
      if (!context.currentUser) {
        throw new GraphQLError('not authenticated', { extensions: { code: 'UNAUTHENTICATED' } })
      }
      const authDoc = await Author.findOne({ name: args.name })
      if (!authDoc) return null
      authDoc.born = args.setBornTo
      try {
        await authDoc.save()
      } catch (error) {
        throw new GraphQLError('Updating author failed: ' + error.message, {
          extensions: { code: 'BAD_USER_INPUT', invalidArgs: args.name, error }
        })
      }
      return authDoc
    },

    createUser: async (root, args) => {
      const user = new User({
        username: args.username,
        favoriteGenre: args.favoriteGenre
      })
      try {
        return await user.save()
      } catch (error) {
        throw new GraphQLError('Creating user failed: ' + error.message, {
          extensions: { code: 'BAD_USER_INPUT', invalidArgs: args.username, error }
        })
      }
    },

    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })
      if (!user || args.password !== 'secret') {
        throw new GraphQLError('wrong credentials', { extensions: { code: 'BAD_USER_INPUT' } })
      }
      const userForToken = {
        username: user.username,
        id: user._id
      }
      return { value: jwt.sign(userForToken, process.env.JWT_SECRET) }
    }
  },

  Author: {
    bookCount: (root) => Book.countDocuments({ author: root._id }),
  }
}

const server = new ApolloServer({ typeDefs, resolvers })
startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async ({ req }) => {
    const auth = req.headers.authorization || ''
    if (auth.startsWith('Bearer ')) {
      const decodedToken = jwt.verify(auth.substring(7), process.env.JWT_SECRET)
      const currentUser = await User.findById(decodedToken.id)
      return { currentUser }
    }
  }
})
  .then(({ url }) => console.log(`Server ready at ${url}`))
