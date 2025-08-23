// src/hooks/useAnimals.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listAnimals, createAnimal, updateAnimal, deleteAnimal } from '../api/sdk/animals';

export function useAnimals(search) {
  return useQuery({ queryKey: ['animals', search], queryFn: () => listAnimals(search) });
}

export function useCreateAnimal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAnimal,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['animals'] }),
  });
}

export function useUpdateAnimal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateAnimal(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['animals'] });
      qc.invalidateQueries({ queryKey: ['animal', id] });
    },
  });
}

export function useDeleteAnimal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAnimal,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['animals'] }),
  });
}
