import { useEffect, useState } from "react"
import axios from "axios"

function Leaderboard({ projectId }) {
    const [users, setUsers] = useState([])

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await axios.get(
                    `http://localhost:5001/api/leaderboard/${projectId}`
                )
                setUsers(res.data.leaderboard)
            } catch (err) {
                console.error("Leaderboard fetch error", err)
            }
        }

        if (projectId) {
            fetchLeaderboard()
        }
    }, [projectId])

    if (!users || users.length === 0) {
        return (
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 mt-4 text-center text-slate-400">
                <h2 className="text-xl font-bold mb-2 text-white">Leaderboard</h2>
                <p>No leaderboard data available yet.</p>
            </div>
        )
    }

    return (
        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 mt-4">
            <h2 className="text-xl font-bold mb-4 text-white">Leaderboard</h2>
            <div className="space-y-2">
                {users.map((user, index) => {
                    const crown =
                        index === 0 ? "👑" :
                            index === 1 ? "🥈" :
                                index === 2 ? "🥉" : ""

                    return (
                        <div
                            key={index}
                            className="flex justify-between p-3 bg-slate-800 border border-slate-700 rounded-lg items-center"
                        >
                            <div className="text-slate-200 font-medium">
                                <span className="text-slate-400 mr-2">{index + 1}.</span>
                                <span className="mr-2 text-lg">{crown}</span>
                                {user.email}
                            </div>
                            <div className="font-bold text-violet-400">
                                {user.score} pt
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default Leaderboard
