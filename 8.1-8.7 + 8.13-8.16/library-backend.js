import dotenv from 'dotenv'
dotenv.config()
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { PubSub } from 'graphql-subscriptions'
const pubsub = new PubSub()
import { GraphQLError } from 'graphql'
import express from 'express'
import cors from 'cors'
import http from 'http'
import { WebSocketServer } from 'ws'
import { useServer } from 'graphql-ws/lib/use/ws'
import process from 'process'
import Person from './models/person.js'
import User   from './models/user.js'
import Book   from './models/book.js'

mongoose.set('strictQuery', false)
const MONGODB_URI = process.env.MONGODB_URI
console.log('connecting to', MONGODB_URI)
mongoose.connect(MONGODB_URI)
  .then(() => console.log('connected to MongoDB'))
  .catch(err => console.error('connection error:', err.message))

const typeDefs = `
  enum YesNo { YES NO }

  type Address {
    street: String!
    city: String!
  }

  type Person {
    name: String!
    phone: String
    address: Address!
    friendOf: [User!]!
    id: ID!
  }

  type User {
    username: String!
    friends: [Person!]!
    id: ID!
  }

  type Book {
    title: String!
    published: Int!
    author: String!
    genres: [String!]!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Query {
    personCount: Int!
    allPersons(phone: YesNo): [Person!]!
    findPerson(name: String!): Person
    allAuthors: [User!]! 
    me: User
  }

  type Mutation {
    addPerson(
      name: String!
      phone: String
      street: String!
      city: String!
    ): Person
    editNumber(
      name: String!
      phone: String!
    ): Person
    createUser(
      username: String!
    ): User
    login(
      username: String!
      password: String!
    ): Token
    addAsFriend(
      name: String!
    ): User
    addBook(
      title: String!
      author: String!
      published: Int!
      genres: [String!]!
    ): Book
  }

  type Subscription {
    personAdded: Person!
    bookAdded: Book!
  }
`

const resolvers = {
  Query: {
    personCount:    () => Person.collection.countDocuments(),
    allPersons:     (root, args) => {
      if (!args.phone) {
        return Person.find({}).populate('friendOf')
      }
      return Person.find({ phone: { $exists: args.phone === 'YES' } }).populate('friendOf')
    },
    findPerson:      (root, args) => Person.findOne({ name: args.name }).populate('friendOf'),
    me:              (root, args, context) => context.currentUser
  },

  Mutation: {
    addPerson: async (root, args, context) => {
      if (!context.currentUser) throw new Error('not authenticated')
      const person = new Person({ ...args })
      await person.save()
      pubsub.publish('PERSON_ADDED', { personAdded: person })
      return person
    },

    addBook: async (root, args, context) => {
      if (!context.currentUser) throw new Error('not authenticated')
      const book = new Book({ ...args })
      await book.save()
      pubsub.publish('BOOK_ADDED', { bookAdded: book })
      return book
    },

    editNumber: async (root, args) => {
      const person = await Person.findOne({ name: args.name })
      person.phone = args.phone
      await person.save()
      return person
    },

    createUser: async (root, args) => {
      const user = new User({ username: args.username })
      return user.save()
    },

    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })
      if (!user || args.password !== 'secret') {
        throw new GraphQLError('wrong credentials', { extensions: { code: 'BAD_USER_INPUT' } })
      }
      const token = jwt.sign({ username: user.username, id: user._id }, process.env.JWT_SECRET)
      return { value: token }
    },

    addAsFriend: async (root, args, context) => {
      if (!context.currentUser) throw new Error('not authenticated')
      const person = await Person.findOne({ name: args.name })
      context.currentUser.friends = context.currentUser.friends.concat(person)
      await context.currentUser.save()
      return context.currentUser
    }
  },

  Subscription: {
    personAdded: {
      subscribe: () => pubsub.asyncIterator(['PERSON_ADDED'])
    },
    bookAdded: {
      subscribe: () => pubsub.asyncIterator(['BOOK_ADDED'])
    }
  }
}

const schema = makeExecutableSchema({ typeDefs, resolvers })

const app = express()
const httpServer = http.createServer(app)

const wsServer = new WebSocketServer({ server: httpServer, path: '/' })
const serverCleanup = useServer({ schema }, wsServer)

const server = new ApolloServer({
  schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose()
          }
        }
      }
    }
  ]
})

async function start() {
  await server.start()
  app.use(
    '/',
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        const auth = req.headers.authorization || ''
        if (auth.startsWith('Bearer ')) {
          const decoded = jwt.verify(auth.substring(7), process.env.JWT_SECRET)
          const currentUser = await User.findById(decoded.id)
          return { currentUser }
        }
      }
    })
  )

  httpServer.listen(4000, () =>
    console.log('Server ready at http://localhost:4000/')
  )
}

start()
