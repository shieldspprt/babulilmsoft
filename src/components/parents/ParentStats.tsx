import React from 'react';
import { Users, GraduationCap, BookOpen, Search } from 'lucide-react';

interface ParentStatsProps {
  stats: {
    totalFamilies: number;
    fathers: number;
    mothers: number;
    totalChildren: number;
    totalPotential: number;
    totalScholarships: number;
  };
}

export const ParentStats: React.FC<ParentStatsProps> = ({ stats }) => {
  return (
    <div className="manager-stats-grid">
      <div className="manager-stat-card blue">
        <div className="manager-stat-icon"><Users size={20} /></div>
        <div className="manager-stat-info">
          <div className="manager-stat-label">Total Families</div>
          <div className="manager-stat-value">{stats.totalFamilies}</div>
          <div className="manager-stat-sub">
            {stats.fathers} Fathers • {stats.mothers} Mothers
          </div>
        </div>
      </div>

      <div className="manager-stat-card green">
        <div className="manager-stat-icon"><GraduationCap size={20} /></div>
        <div className="manager-stat-info">
          <div className="manager-stat-label">Total Children</div>
          <div className="manager-stat-value">{stats.totalChildren}</div>
          <div className="manager-stat-sub">Avg {stats.totalFamilies > 0 ? (stats.totalChildren / stats.totalFamilies).toFixed(1) : 0} per family</div>
        </div>
      </div>

      <div className="manager-stat-card amber">
        <div className="manager-stat-icon"><BookOpen size={20} /></div>
        <div className="manager-stat-info">
          <div className="manager-stat-label">Monthly Potential</div>
          <div className="manager-stat-value">Rs {stats.totalPotential.toLocaleString()}</div>
          <div className="manager-stat-sub">Total expected from parents</div>
        </div>
      </div>

      <div className="manager-stat-card rose">
        <div className="manager-stat-icon"><Search size={20} /></div>
        <div className="manager-stat-info">
          <div className="manager-stat-label">Financial Aid</div>
          <div className="manager-stat-value">Rs {stats.totalScholarships.toLocaleString()}</div>
          <div className="manager-stat-sub">Total scholarship/discounts</div>
        </div>
      </div>
    </div>
  );
};
