import { useQuery, gql } from '@apollo/client'
import { ALL_BOOKS } from '../queries'

const Books = ({ show }) => {
  if (!show) return null

  const { loading, error, data } = useQuery(ALL_BOOKS)
  if (loading) return <p>Loading books…</p>
  if (error)   return <p style={{ color: 'red' }}>Error: {error.message}</p>

  return (
    <div>
      <h2>Books</h2>
      <table>
        <thead>
          <tr>
            <th align="left">Title</th>
            <th align="left">Author</th>
            <th align="left">Published</th>
          </tr>
        </thead>
        <tbody>
          {data.allBooks.map(b => (
            <tr key={b.id}>
              <td>{b.title}</td>
              <td>{b.author.name}</td>
              <td>{b.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Books
