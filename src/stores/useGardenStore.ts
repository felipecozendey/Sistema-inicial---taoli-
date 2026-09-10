import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useTaskSettingsStore } from './useTaskSettingsStore';

export interface GardenPlant {
  id: string;
  user_id: string;
  plot_index: number;
  species: string;
  stage: number; // 0 = semente, 1 = broto, 2 = planta, 3 = flor
  planted_at: string;
  task_id?: string | null;
}

export interface GardenState {
  id?: string;
  user_id?: string;
  points: number;
  level: number;
  plot_count: number;
  streak_days: number;
  last_action_at?: string | null;
}

interface GardenStore {
  state: GardenState;
  plants: GardenPlant[];
  isLoading: boolean;
  fetchGarden: () => Promise<void>;
  addPoints: (points: number, reason?: string) => Promise<void>;
  onTaskCompleted: (taskId: string, taskTitle: string) => Promise<void>;
  onHabitCompleted: (habitId: string, habitTitle: string) => Promise<void>;
  waterPlant: (plotIndex: number) => Promise<void>;
  unlockNextPlot: () => Promise<boolean>;
  harvestPlant: (plotIndex: number) => Promise<void>;
}

const PLANT_SPECIES = [
  { name: 'Girassol Dourado', icon: '🌻', color: 'text-amber-500' },
  { name: 'Rosa Silvestre', icon: '🌹', color: 'text-rose-500' },
  { name: 'Tulipa Primaveril', icon: '🌷', color: 'text-pink-500' },
  { name: 'Flor de Lótus', icon: '🪷', color: 'text-emerald-500' },
  { name: 'Trevo Mágico', icon: '🍀', color: 'text-green-500' },
  { name: 'Lavanda Relaxante', icon: '🪻', color: 'text-purple-500' },
];

export const useGardenStore = create<GardenStore>((set, get) => ({
  state: {
    points: 0,
    level: 1,
    plot_count: 6,
    streak_days: 1,
  },
  plants: [],
  isLoading: false,

  fetchGarden: async () => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ isLoading: false });
        return;
      }

      // Fetch garden state
      let { data: stateData, error: stateError } = await supabase
        .from('garden_state')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!stateData && !stateError) {
        // Create initial garden state
        const { data: newState, error: insertError } = await supabase
          .from('garden_state')
          .insert({
            user_id: user.id,
            points: 20,
            level: 1,
            plot_count: 6,
            streak_days: 1,
          })
          .select()
          .single();

        if (!insertError) {
          stateData = newState;
        }
      }

      // Fetch plants
      const { data: plantsData, error: plantsError } = await supabase
        .from('garden_plants')
        .select('*')
        .eq('user_id', user.id)
        .order('plot_index', { ascending: true });

      if (stateData) {
        set({
          state: {
            id: stateData.id,
            user_id: stateData.user_id,
            points: Number(stateData.points || 0),
            level: Number(stateData.level || 1),
            plot_count: Number(stateData.plot_count || 6),
            streak_days: Number(stateData.streak_days || 0),
            last_action_at: stateData.last_action_at,
          },
          plants: plantsData || [],
          isLoading: false,
        });
      } else {
        set({ plants: plantsData || [], isLoading: false });
      }
    } catch (err) {
      console.warn('Error loading garden data:', err);
      set({ isLoading: false });
    }
  },

  addPoints: async (amount: number, reason?: string) => {
    const prev = get().state;
    const settings = useTaskSettingsStore.getState().settings;
    const ptsPerLevel = settings.points_per_level || 100;

    const newPoints = prev.points + amount;
    const newLevel = Math.max(1, Math.floor(newPoints / ptsPerLevel) + 1);
    const leveledUp = newLevel > prev.level;

    set({
      state: {
        ...prev,
        points: newPoints,
        level: newLevel,
        last_action_at: new Date().toISOString(),
      },
    });

    if (leveledUp) {
      toast({
        title: '🎉 Subiu de nível!',
        description: `Parabéns! Seu Jardim atingiu o Nível ${newLevel}!`,
      });
    } else if (reason) {
      toast({
        title: `+${amount} pontos no Jardim 🌱`,
        description: reason,
      });
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('garden_state')
        .upsert({
          user_id: user.id,
          points: newPoints,
          level: newLevel,
          plot_count: prev.plot_count,
          streak_days: prev.streak_days,
          last_action_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
    } catch (err) {
      console.warn('Error syncing garden points:', err);
    }
  },

  onTaskCompleted: async (taskId: string, taskTitle: string) => {
    const settings = useTaskSettingsStore.getState().settings;
    const pts = settings.points_per_task || 10;
    await get().addPoints(pts, `Tarefa concluída: "${taskTitle}"`);

    // Try planting or growing a plant
    const plants = [...get().plants];
    const plotCount = get().state.plot_count;

    // Find first empty plot or first growing plant
    const occupiedPlots = new Set(plants.map(p => p.plot_index));
    let emptyPlot = -1;
    for (let i = 0; i < plotCount; i++) {
      if (!occupiedPlots.has(i)) {
        emptyPlot = i;
        break;
      }
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (emptyPlot !== -1) {
      // Plant a new seedling!
      const randomSpecies = PLANT_SPECIES[Math.floor(Math.random() * PLANT_SPECIES.length)].name;
      const newPlant: GardenPlant = {
        id: crypto.randomUUID(),
        user_id: user.id,
        plot_index: emptyPlot,
        species: randomSpecies,
        stage: 0, // seed
        planted_at: new Date().toISOString(),
        task_id: taskId,
      };

      set({ plants: [...plants, newPlant] });

      toast({
        title: '🌱 Nova semente plantada!',
        description: `Você plantou uma semente de ${randomSpecies} no Canteiro #${emptyPlot + 1}!`,
      });

      try {
        await supabase.from('garden_plants').insert({
          id: newPlant.id,
          user_id: user.id,
          plot_index: emptyPlot,
          species: randomSpecies,
          stage: 0,
          task_id: taskId,
        });
      } catch (err) {
        console.warn('Error saving plant to DB:', err);
      }
    } else {
      // All plots occupied! Advance growth of the oldest non-flower plant
      const growingPlant = plants.find(p => p.stage < 3);
      if (growingPlant) {
        const nextStage = growingPlant.stage + 1;
        const updatedPlants = plants.map(p =>
          p.id === growingPlant.id ? { ...p, stage: nextStage } : p
        );
        set({ plants: updatedPlants });

        const stageNames = ['broto 🌱', 'planta em crescimento 🌿', 'flor radiante! 🌸'];
        toast({
          title: '🌿 Sua planta cresceu!',
          description: `O ${growingPlant.species} virou um ${stageNames[nextStage - 1]}`,
        });

        try {
          await supabase
            .from('garden_plants')
            .update({ stage: nextStage, updated_at: new Date().toISOString() })
            .eq('id', growingPlant.id);
        } catch (err) {
          console.warn('Error updating plant stage:', err);
        }
      } else {
        toast({
          title: '🌸 Jardim totalmente florido!',
          description: 'Todos os seus canteiros estão cheios! Colha suas flores ou desbloqueie mais canteiros!',
        });
      }
    }
  },

  onHabitCompleted: async (_habitId: string, habitTitle: string) => {
    const settings = useTaskSettingsStore.getState().settings;
    const pts = settings.points_per_habit || 5;
    await get().addPoints(pts, `Hábito cumprido: "${habitTitle}"`);

    // Advance growth on a random growing plant
    const plants = [...get().plants];
    const growing = plants.filter(p => p.stage < 3);
    if (growing.length > 0) {
      const target = growing[Math.floor(Math.random() * growing.length)];
      const nextStage = target.stage + 1;
      set({
        plants: plants.map(p => p.id === target.id ? { ...p, stage: nextStage } : p),
      });

      try {
        await supabase
          .from('garden_plants')
          .update({ stage: nextStage, updated_at: new Date().toISOString() })
          .eq('id', target.id);
      } catch (err) {
        console.warn('Error updating plant:', err);
      }
    }
  },

  waterPlant: async (plotIndex: number) => {
    const plants = [...get().plants];
    const target = plants.find(p => p.plot_index === plotIndex);
    if (!target) return;

    if (target.stage >= 3) {
      toast({
        title: 'Flor radiante! ✨',
        description: 'Esta flor já atingiu seu potencial máximo! Você pode colhê-la para liberar espaço.',
      });
      return;
    }

    const nextStage = target.stage + 1;
    set({
      plants: plants.map(p => p.plot_index === plotIndex ? { ...p, stage: nextStage } : p),
    });

    toast({
      title: '💧 Planta regada!',
      description: `${target.species} está crescendo vigorosamente!`,
    });

    try {
      await supabase
        .from('garden_plants')
        .update({ stage: nextStage, updated_at: new Date().toISOString() })
        .eq('id', target.id);
    } catch (err) {
      console.warn('Error watering plant:', err);
    }
  },

  harvestPlant: async (plotIndex: number) => {
    const plants = [...get().plants];
    const target = plants.find(p => p.plot_index === plotIndex);
    if (!target) return;

    const harvestBonus = target.stage === 3 ? 25 : 10;
    const prevPlants = plants;

    set({
      plants: plants.filter(p => p.plot_index !== plotIndex),
    });

    await get().addPoints(harvestBonus, `Flor colhida com sucesso! 💐`);

    try {
      await supabase.from('garden_plants').delete().eq('id', target.id);
    } catch (err) {
      set({ plants: prevPlants });
      toast({
        title: 'Erro ao colher',
        description: 'Não foi possível colher a flor.',
        variant: 'destructive',
      });
    }
  },

  unlockNextPlot: async () => {
    const settings = useTaskSettingsStore.getState().settings;
    const cost = settings.unlock_plot_cost || 50;
    const state = get().state;

    if (state.points < cost) {
      toast({
        title: 'Pontos insuficientes',
        description: `Você precisa de ${cost} pontos para desbloquear um novo canteiro (você tem ${state.points}).`,
        variant: 'destructive',
      });
      return false;
    }

    const newPlotCount = state.plot_count + 1;
    const newPoints = state.points - cost;

    set({
      state: {
        ...state,
        plot_count: newPlotCount,
        points: newPoints,
      },
    });

    toast({
      title: '🎉 Novo canteiro desbloqueado!',
      description: `Seu jardim agora conta com ${newPlotCount} canteiros para cultivar!`,
    });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return true;

      await supabase
        .from('garden_state')
        .update({
          plot_count: newPlotCount,
          points: newPoints,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      return true;
    } catch (err) {
      console.warn('Error updating plot count:', err);
      return true;
    }
  },
}));
