import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

export function useOverview() {
  return useQuery({
    queryKey: ['analytics-overview'],
    queryFn: async () => {
      const res = await api.get('/analytics/overview');
      return res.data.data;
    },
  });
}

export function useTasksOverTime() {
  return useQuery({
    queryKey: ['analytics-tasks-over-time'],
    queryFn: async () => {
      const res = await api.get('/analytics/tasks-over-time');
      return res.data.data;
    },
  });
}

export function useTopMembers() {
  return useQuery({
    queryKey: ['analytics-top-members'],
    queryFn: async () => {
      const res = await api.get('/analytics/top-members');
      return res.data.data;
    },
  });
}

export function useProjectProgress() {
  return useQuery({
    queryKey: ['analytics-project-progress'],
    queryFn: async () => {
      const res = await api.get('/analytics/project-progress');
      return res.data.data;
    },
  });
}