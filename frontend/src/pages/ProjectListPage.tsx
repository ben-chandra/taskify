import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { CreateProjectModal } from '../components/CreateProjectModal/CreateProjectModal';

export function ProjectListPage() {
  const [showCreate, setShowCreate] = useState(false);
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: api.listProjects,
  });

  return (
    <div className="project-list">
      <h2>Projects</h2>
      {isLoading || !projects ? (
        <p>Loading projects…</p>
      ) : (
        <ul>
          {projects.map((project) => (
            <li key={project.id}>
              <Link to={`/projects/${project.id}`}>{project.name}</Link>
            </li>
          ))}
        </ul>
      )}
      <button type="button" onClick={() => setShowCreate(true)}>
        New Project
      </button>
      {showCreate ? <CreateProjectModal onClose={() => setShowCreate(false)} /> : null}
    </div>
  );
}
