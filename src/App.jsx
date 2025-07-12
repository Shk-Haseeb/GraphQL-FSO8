import { useState } from 'react'
import { useApolloClient, useSubscription } from '@apollo/client'
import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import EditAuthor from './components/EditAuthor'
import Recommendations from './components/Recommendations'
import LoginForm from './components/LoginForm'
import Notify from './components/Notify'
import { ALL_BOOKS, BOOK_ADDED } from './queries'

const App = () => {
  const [page, setPage] = useState('authors')
  const [token, setToken] = useState(null)
  const [errorMessage, setError] = useState(null)
  const client = useApolloClient()

  const notify = (message) => {
    setError(message)
    setTimeout(() => setError(null), 5000)
  }

  const logout = () => {
    setToken(null)
    localStorage.removeItem('library-user-token')
    client.resetStore()
    setPage('authors')
  }

  useSubscription(BOOK_ADDED, {
    onData: ({ data }) => {
      const addedBook = data.data.bookAdded
      window.alert(`New book added: "${addedBook.title}" by ${addedBook.author}`)
      client.cache.updateQuery(
        { query: ALL_BOOKS, variables: { genre: null } },
        ({ allBooks }) => ({
          allBooks: allBooks.concat(addedBook),
        })
      )
    }
  })

  return (
    <div>
      <Notify errorMessage={errorMessage} />

      <nav>
        <button onClick={() => setPage('authors')}>authors</button>
        <button onClick={() => setPage('books')}>books</button>

        {token ? (
          <>
            <button onClick={() => setPage('add')}>add book</button>
            <button onClick={() => setPage('edit')}>edit author</button>
            <button onClick={() => setPage('recommend')}>recommendations</button>
            <button onClick={logout}>logout</button>
          </>
        ) : (
          <button onClick={() => setPage('login')}>login</button>
        )}
      </nav>

      {page === 'login'     && <LoginForm setToken={setToken} setError={notify} />}
      {page === 'authors'   && <Authors show={true} />}
      {page === 'books'     && <Books show={true} />}
      {page === 'add'       && <NewBook show={true} />}
      {page === 'recommend' && <Recommendations show={true} />}
      {page === 'edit'      && <EditAuthor show={true} />}
    </div>
  )
}

export default App
