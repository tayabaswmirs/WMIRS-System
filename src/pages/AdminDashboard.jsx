import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import StatPill from "../components/common/StatPill";
import { getAllUsers } from "../firebase/services/userService";
import { subscribeToAllIncidents } from "../firebase/services/incidentService";
import { subscribeToAllMonitoring } from "../firebase/services/monitoringService";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import "../styles/dashboard.css";

const COLORS = ['#00ed64', '#3d8eff', '#f5a524', '#ff5722', '#9c27b0'];
const STATUS_COLORS = {
  "Submitted": "#3d8eff",
  "Under Review": "#f5a524",
  "Resolved": "#00ed64",
  "Approved": "#00ed64",
  "Dismissed": "#ff5722",
  "Rejected/Flagged": "#ff5722"
};

function AdminDashboard() {
  const [counts, setCounts] = useState({ admin: 0, staff: 0, ranger: 0 });
  const [incidents, setIncidents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    let active = true;
    getAllUsers().then((users) => {
      if (!active) return;
      const c = { admin: 0, staff: 0, ranger: 0 };
      users.forEach((u) => {
        const role = u.role || "ranger";
        if (c[role] !== undefined) c[role] += 1;
      });
      setCounts(c);
      setLoadingUsers(false);
    }).catch(console.error);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const unsubIncidents = subscribeToAllIncidents(setIncidents);
    const unsubLogs = subscribeToAllMonitoring(setLogs);
    return () => {
      unsubIncidents();
      unsubLogs();
    };
  }, []);

  // Compute analytics
  const { categoryData, statusData, velocity } = useMemo(() => {
    const cats = {};
    const stats = {};
    let resolvedCount = 0;
    
    // Process Incidents
    incidents.forEach(inc => {
      cats[inc.category] = (cats[inc.category] || 0) + 1;
      stats[inc.status] = (stats[inc.status] || 0) + 1;
      if (inc.status === 'Resolved' || inc.status === 'Dismissed') resolvedCount++;
    });
    
    // Process Monitoring Logs
    logs.forEach(log => {
      const catName = log.category === 'BMS' ? 'Biodiversity' : log.category;
      cats[catName] = (cats[catName] || 0) + 1;
      stats[log.status] = (stats[log.status] || 0) + 1;
      if (log.status === 'Approved' || log.status === 'Rejected/Flagged') resolvedCount++;
    });

    const categoryArray = Object.keys(cats).map(name => ({ name, value: cats[name] })).sort((a,b) => b.value - a.value);
    const statusArray = Object.keys(stats).map(name => ({ name, value: stats[name] }));
    const totalItems = incidents.length + logs.length;
    const resolutionVelocity = totalItems > 0 ? Math.round((resolvedCount / totalItems) * 100) : 0;

    return { categoryData: categoryArray, statusData: statusArray, velocity: resolutionVelocity };
  }, [incidents, logs]);

  return (
    <DashboardLayout>
      <div className="incidents-page">
        {/* Page Header */}
        <div className="inc-hero">
          <div className="inc-hero__left">
            <span className="inc-hero__eyebrow">Administration</span>
            <h1 className="inc-hero__title">Executive Dashboard</h1>
            <p className="inc-hero__subtitle">
              System-wide oversight, performance metrics, and user distribution.
            </p>
          </div>
          <div className="inc-hero__stats">
            {loadingUsers ? <span className="text-[var(--c-stone-muted)]">Loading users...</span> : (
              <>
                <StatPill icon="shield_person" label="Administrators" count={counts.admin} color="var(--c-brand)" />
                <StatPill icon="badge" label="Staff Members" count={counts.staff} color="var(--c-blue)" />
                <StatPill icon="park" label="Forest Rangers" count={counts.ranger} color="var(--c-green-dark)" />
              </>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '24px' }}>
          {/* Velocity Card */}
          <div className="card-base" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h3 className="text-[var(--c-stone)] font-medium mb-4">Overall Resolution Velocity</h3>
            <div className="relative flex items-center justify-center w-48 h-48 rounded-full border-[8px] border-[var(--c-bg-subtle)]" style={{ borderColor: `var(--c-brand)` }}>
              <span className="text-4xl font-bold text-[var(--c-stone-light)]">{velocity}%</span>
            </div>
            <p className="text-[var(--c-stone-muted)] mt-4 text-sm text-center">Percentage of total reports and logs that have been resolved or finalized.</p>
          </div>

          {/* Category Distribution Chart */}
          <div className="card-base" style={{ padding: '24px' }}>
            <h3 className="text-[var(--c-stone)] font-medium mb-4">Submissions by Category</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis type="number" stroke="var(--c-stone-muted)" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="var(--c-stone-muted)" fontSize={12} width={100} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--c-bg-dark)', border: '1px solid var(--c-border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--c-stone-light)' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Distribution Pie Chart */}
          <div className="card-base" style={{ padding: '24px' }}>
            <h3 className="text-[var(--c-stone)] font-medium mb-4">Overall Status Distribution</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--c-bg-dark)', border: '1px solid var(--c-border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--c-stone-light)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--c-stone)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

export default AdminDashboard;
