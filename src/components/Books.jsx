import { useQuery, gql } from '@apollo/client'

const ALL_BOOKS = gql`
  query {
    allBooks {
      id
      title
      published
      genres
      author { name }
    }
  }
`

const Books = ({ show }) => {
  const [selectedGenre, setSelectedGenre] = useState(null)
  const { loading, error, data } = useQuery(ALL_BOOKS)

  if (!show) return null
  if (loading) return <p>Loading books…</p>
  if (error)   return <p style={{ color: 'red' }}>Error: {error.message}</p>

  const allBooks = data.allBooks

  const genres = Array.from(
    new Set(allBooks.flatMap(book => book.genres))
  )

  const booksToShow = selectedGenre
    ? allBooks.filter(book => book.genres.includes(selectedGenre))
    : allBooks

  return (
    <div>
      <h2>Books</h2>

      <div style={{ margin: '1em 0' }}>
        <button
          onClick={() => setSelectedGenre(null)}
          style={{ fontWeight: selectedGenre === null ? 'bold' : 'normal' }}
        >
          all genres
        </button>
        {genres.map(g => (
          <button
            key={g}
            onClick={() => setSelectedGenre(g)}
            style={{
              fontWeight: selectedGenre === g ? 'bold' : 'normal',
              marginLeft: '0.5em'
            }}
          >
            {g}
          </button>
        ))}
      </div>

      <table>
        <thead>
          <tr>
            <th align="left">Title</th>
            <th align="left">Author</th>
            <th align="left">Published</th>
          </tr>
        </thead>
        <tbody>
          {booksToShow.map(b => (
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
