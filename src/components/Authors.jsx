import { useQuery, useMutation } from '@apollo/client'
import Select from 'react-select'
import { ALL_AUTHORS, EDIT_AUTHOR } from '../queries'

const Authors = ({ show }) => {
  if (!show) return null

  const { loading, error, data } = useQuery(ALL_AUTHORS)

  const [ editAuthor ] = useMutation(EDIT_AUTHOR, {
    refetchQueries: [{ query: ALL_AUTHORS }]
  })

  const [selectedOption, setSelectedOption] = useState(null)
  const [bornYear, setBornYear]             = useState('')

  if (loading) return <p>Loading authors…</p>
  if (error)   return <p style={{ color: 'red' }}>Error: {error.message}</p>

  const authors = data.allAuthors

  const options = authors.map(a => ({
    value: a.name,
    label: a.name
  }))

  const submit = async (e) => {
    e.preventDefault()
    if (!selectedOption) return

    await editAuthor({
      variables: {
        name:      selectedOption.value,
        setBornTo: Number(bornYear)
      }
    })
    setBornYear('')
    setSelectedOption(null)
  }

  return (
    <div>
      <h2>Authors</h2>

      <table>
        <thead>
          <tr>
            <th align="left">Name</th>
            <th align="left">Born</th>
            <th align="left">Books</th>
          </tr>
        </thead>
        <tbody>
          {authors.map(a =>
            <tr key={a.id}>
              <td>{a.name}</td>
              <td>{a.born ?? '–'}</td>
              <td>{a.bookCount}</td>
            </tr>
          )}
        </tbody>
      </table>

      <h3>Set birth year</h3>
      <form onSubmit={submit}>
        <div style={{ marginBottom: '0.5rem', width: '200px' }}>
          <Select
            placeholder="Choose author…"
            options={options}
            value={selectedOption}
            onChange={setSelectedOption}
            isClearable
          />
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <input
            type="number"
            placeholder="Year of birth"
            value={bornYear}
            onChange={(e) => setBornYear(e.target.value)}
          />
        </div>
        <button type="submit" disabled={!selectedOption || !bornYear}>
          Update author
        </button>
      </form>
    </div>
  )
}

export default Authors

