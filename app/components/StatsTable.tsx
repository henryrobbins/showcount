interface StatsTableProps {
  title: string;
  headers: string[];
  rows: (string | number)[][];
}

export default function StatsTable({ title, headers, rows }: StatsTableProps) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold font-mono mb-3">{title}</h2>
      <div className="w-full border border-black">
        <table className="w-full font-mono text-sm">
          <thead>
            <tr className="border-b-2 border-black">
              {headers.map((header, i) => (
                <th
                  key={i}
                  className={`text-left p-3 ${i < headers.length - 1 ? 'border-r border-black' : ''}`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="p-3 text-center text-gray-500">
                  No data available
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i} className="border-b border-black last:border-b-0">
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className={`p-3 ${j < row.length - 1 ? 'border-r border-black' : ''}`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
