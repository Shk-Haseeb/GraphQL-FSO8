import React, { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { ALL_AUTHORS, EDIT_AUTHOR } from '../queries'

const Authors = ({ show }) => {
  if (!show) return null

  const { loading, error, data } = useQuery(ALL_AUTHORS)

  const [ editAuthor ] = useMutation(EDIT_AUTHOR, {
    refetchQueries: [{ query: ALL_AUTHORS }]
  })

  const [selectedName, setSelectedName] = useState('')
  const [bornYear, setBornYear]         = useState('')

  if (loading) return <p>Loading authors…</p>
  if (error)   return <p style={{ color: 'red' }}>{error.message}</p>

  const authors = data.allAuthors

  if (selectedName === '' && authors.length > 0) {
    setSelectedName(authors[0].name)
  }

  const submit = async e => {
    e.preventDefault()
    await editAuthor({
      variables: {
        name: selectedName,
        setBornTo: Number(bornYear)
      }
    })
    setBornYear('')
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
          {authors.map(a => (
            <tr key={a.id}>
              <td>{a.name}</td>
              <td>{a.born ?? '–'}</td>
              <td>{a.bookCount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Set birth year</h3>
      <form onSubmit={submit}>
        <div>
          <label>
            Author&nbsp;
            <select
              value={selectedName}
              onChange={(e) => setSelectedName(e.target.value)}
            >
              {authors.map(a =>
                <option key={a.id} value={a.name}>{a.name}</option>
              )}
            </select>
          </label>
        </div>
        <div>
          <label>
            Born&nbsp;
            <input
              type="number"
              value={bornYear}
              onChange={(e) => setBornYear(e.target.value)}
            />
          </label>
        </div>
        <button type="submit">Update author</button>
      </form>
    </div>
  )
}

export default Authors
