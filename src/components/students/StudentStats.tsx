import React from 'react';
import { GraduationCap, Plus, UserCheck, BookOpen } from 'lucide-react';

interface StudentStatsProps {
  stats: {
    activeCount: number;
    sysRevenue: number;
    manRevenue: number;
    revenueMismatch: boolean;
    scholarshipCount: number;
    newEnrollments: number;
    boys: number;
    girls: number;
  };
}

export const StudentStats: React.FC<StudentStatsProps> = ({ stats }) => {
  return (
    <div className="manager-stats-grid">
      <div className="manager-stat-card blue">
        <div className="manager-stat-icon"><GraduationCap size={20} /></div>
        <div className="manager-stat-info">
          <div className="manager-stat-label">Active Students</div>
          <div className="manager-stat-value">{stats.activeCount}</div>
          <div className="manager-stat-sub">Enrolled & Active</div>
        </div>
        <div className="manager-stat-sub stats-gender-overlay">
          {stats.boys} Boys<br />{stats.girls} Girls
        </div>
      </div>

      <div className="manager-stat-card green">
        <div className="manager-stat-icon"><Plus size={20} /></div>
        <div className="manager-stat-info">
          <div className="manager-stat-label">New This Month</div>
          <div className="manager-stat-value">{stats.newEnrollments}</div>
          <div className="manager-stat-sub">Recent Admissions</div>
        </div>
      </div>

      <div className="manager-stat-card amber">
        <div className="manager-stat-icon"><UserCheck size={20} /></div>
        <div className="manager-stat-info">
          <div className="manager-stat-label">Scholarships</div>
          <div className="manager-stat-value">{stats.scholarshipCount}</div>
          <div className="manager-stat-sub">Students with 0 Fee</div>
        </div>
      </div>

      <div className="manager-stat-card purple">
        <div className="manager-stat-icon"><BookOpen size={20} /></div>
        <div className="manager-stat-info">
          <div className="manager-stat-label">Monthly Potential</div>
          <div className="manager-stat-value">Rs {stats.sysRevenue.toLocaleString()}</div>
          <div className="manager-stat-sub stats-comparison">
            <span>DB: Rs {stats.sysRevenue.toLocaleString()}</span>
            <span className={stats.revenueMismatch ? 'text-danger' : 'text-success'}>
              {stats.revenueMismatch ? `Mismatch: Rs ${stats.manRevenue.toLocaleString()}` : '✓ Matches Manual'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
