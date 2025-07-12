import { useQuery } from '@apollo/client'
import { ME, ALL_BOOKS } from '../queries'

const Recommendations = ({ show }) => {
  const { data: meData, loading: meLoading, error: meError } = useQuery(ME)

  const favoriteGenre = meData?.me?.favoriteGenre || null
  const { data: booksData, loading: booksLoading, error: booksError } = useQuery(
    ALL_BOOKS,
    {
      variables: { genre: favoriteGenre },
      skip: !favoriteGenre
    }
  )

  if (!show) return null
  if (meLoading)    return <p>Loading user…</p>
  if (meError)      return <p>Error: {meError.message}</p>
  if (booksLoading) return <p>Loading recommendations…</p>
  if (booksError)   return <p>Error: {booksError.message}</p>

  const books = booksData.allBooks

  return (
    <div>
      <h2>Recommendations</h2>
      <p>
        Books in your favorite genre <b>{favoriteGenre}</b>:
      </p>
      <table>
        <thead>
          <tr>
            <th align="left">Title</th>
            <th align="left">Author</th>
            <th align="left">Published</th>
          </tr>
        </thead>
        <tbody>
          {books.map(b => (
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

export default Recommendations
