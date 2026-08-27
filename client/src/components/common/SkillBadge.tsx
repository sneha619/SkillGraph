import React from 'react';
import { Link } from 'react-router-dom';

interface SkillBadgeProps {
  name: string;
  category?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  proficiency?: 'Beginner' | 'Intermediate' | 'Expert';
  clickable?: boolean;
  size?: 'sm' | 'md';
}

export const SkillBadge: React.FC<SkillBadgeProps> = ({
  name,
  category,
  difficulty,
  proficiency,
  clickable = true,
  size = 'md',
}) => {
  const getDifficultyColor = () => {
    switch (difficulty || proficiency) {
      case 'Beginner':
        return 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40 hover:border-emerald-500';
      case 'Intermediate':
        return 'bg-blue-950/40 text-blue-300 border-blue-800/40 hover:border-blue-500';
      case 'Advanced':
      case 'Expert':
        return 'bg-purple-950/40 text-purple-300 border-purple-800/40 hover:border-purple-500';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500';
    }
  };

  const badgeContent = (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border font-medium transition ${
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      } ${getDifficultyColor()} ${clickable ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      <span>{name}</span>
      {proficiency && (
        <span className="text-[10px] opacity-70 font-normal">({proficiency})</span>
      )}
    </span>
  );

  if (clickable) {
    return <Link to={`/skills/${encodeURIComponent(name)}`}>{badgeContent}</Link>;
  }

  return badgeContent;
};

