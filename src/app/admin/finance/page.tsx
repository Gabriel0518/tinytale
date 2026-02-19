"use client";

const transactions = [
  { id: "1", type: "recharge", amount: 500, user: "user1@example.com", date: "Feb 15, 2024", status: "Completed" },
  { id: "2", type: "unlock", amount: -100, user: "user2@example.com", date: "Feb 14, 2024", status: "Completed" },
  { id: "3", type: "recharge", amount: 1000, user: "user3@example.com", date: "Feb 13, 2024", status: "Completed" },
  { id: "4", type: "unlock", amount: -100, user: "user1@example.com", date: "Feb 12, 2024", status: "Completed" },
  { id: "5", type: "recharge", amount: 200, user: "user4@example.com", date: "Feb 11, 2024", status: "Completed" },
];

export default function AdminFinancePage() {
  const totalRevenue = transactions.filter((t) => t.type === "recharge").reduce((sum, t) => sum + t.amount, 0);
  const totalSpent = Math.abs(transactions.filter((t) => t.type === "unlock").reduce((sum, t) => sum + t.amount, 0));

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-gray-200">Finance</h1>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl bg-[#13131d] p-6">
          <p className="text-sm text-gray-400">Total Revenue</p>
          <p className="mt-2 text-3xl font-bold text-green-600">${totalRevenue}</p>
        </div>
        <div className="rounded-xl bg-[#13131d] p-6">
          <p className="text-sm text-gray-400">Total Spent on Content</p>
          <p className="mt-2 text-3xl font-bold text-red-600">${totalSpent}</p>
        </div>
        <div className="rounded-xl bg-[#13131d] p-6">
          <p className="text-sm text-gray-400">Net Revenue</p>
          <p className="mt-2 text-3xl font-bold text-blue-600">${totalRevenue - totalSpent}</p>
        </div>
      </div>

      {/* Transactions */}
      <div className="rounded-xl bg-[#13131d]">
        <div className="border-b border-gray-700/50 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-200">Recent Transactions</h2>
        </div>
        <table className="w-full">
          <thead className="bg-[#0f0f17]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-[#1a1a2e]">
                <td className="whitespace-nowrap px-6 py-4">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                    tx.type === "recharge" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {tx.type === "recharge" ? "Recharge" : "Unlock"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                  <span className={tx.amount > 0 ? "text-green-600" : "text-red-600"}>
                    {tx.amount > 0 ? "+" : ""}{tx.amount} coins
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-400">{tx.user}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-400">{tx.date}</td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                    {tx.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
