import React from 'react'
import { useQuery, gql } from '@apollo/client'

const ALL_AUTHORS = gql`
  query {
    allAuthors {
      id
      name
      born
      bookCount
    }
  }
`

const Authors = ({ show }) => {
  if (!show) return null

  const { loading, error, data } = useQuery(ALL_AUTHORS)

  if (loading) return <p>Loading authors…</p>
  if (error)   return <p style={{ color: 'red' }}>Error: {error.message}</p>

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
          {data.allAuthors.map(a => (
            <tr key={a.id}>
              <td>{a.name}</td>
              <td>{a.born ?? '–'}</td>
              <td>{a.bookCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Authors
