import AdminLayout from "./layout";

export default function AdminDashboard() {
  const stats = [
    { label: "Total Dramas", value: "156", change: "+12%", color: "text-blue-600" },
    { label: "Total Users", value: "12,345", change: "+8%", color: "text-green-600" },
    { label: "Total Revenue", value: "$45,678", change: "+23%", color: "text-yellow-600" },
    { label: "Total Views", value: "1.2M", change: "+15%", color: "text-purple-600" },
  ];

  const recentDramas = [
    { title: "The CEO's Secret Love", views: "45.2K", status: "Published" },
    { title: "Revenge of the Princess", views: "32.1K", status: "Published" },
    { title: "Sweet Love in Office", views: "28.9K", status: "Draft" },
    { title: "Mysterious Doctor", views: "15.3K", status: "Published" },
  ];

  return (
    <AdminLayout>
      <div>
        <h1 className="mb-8 text-2xl font-bold text-gray-900">Dashboard</h1>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">{stat.value}</span>
                <span className={`text-sm font-medium ${stat.color}`}>{stat.change}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Dramas */}
        <div className="rounded-xl bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Dramas</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Views</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentDramas.map((drama, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{drama.title}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{drama.views}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                      drama.status === "Published" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {drama.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    <button className="text-blue-600 hover:text-blue-800">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
