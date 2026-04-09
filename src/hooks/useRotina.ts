import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { RoutineDefinition, RoutineItem, UsageLog, UsageLogItem, SkinProgress } from '../lib/supabase'

// ── Busca a rotina ativa para o período do dia ────────────────────────────
export function useActiveRoutine(period: 'manha' | 'noite') {
  return useQuery({
    queryKey: ['routine', period],
    queryFn: async () => {
      const { data: routine, error } = await supabase
        .from('routine_definitions')
        .select('*')
        .eq('period', period)
        .single()

      if (error) throw error

      const { data: items, error: itemsError } = await supabase
        .from('routine_items')
        .select('*, catalog_products(*)')
        .eq('routine_id', (routine as RoutineDefinition).id)
        .order('sort_order')

      if (itemsError) throw itemsError

      return { routine: routine as RoutineDefinition, items: items as RoutineItem[] }
    },
  })
}

// ── Busca ou cria o usage_log de hoje ────────────────────────────────────
export function useTodayLog(routineId: string | undefined) {
  return useQuery({
    queryKey: ['usage_log_today', routineId],
    enabled: !!routineId,
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('usage_logs')
        .select('*, usage_log_items(*)')
        .eq('routine_id', routineId!)
        .gte('executed_at', today + 'T00:00:00')
        .lte('executed_at', today + 'T23:59:59')
        .maybeSingle()

      if (error) throw error
      return data as (UsageLog & { usage_log_items: UsageLogItem[] }) | null
    },
  })
}

// ── Cria log do dia + itens ───────────────────────────────────────────────
export function useCreateLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      routineId,
      productIds,
    }: {
      routineId: string
      productIds: string[]
    }) => {
      const { data: log, error } = await supabase
        .from('usage_logs')
        .insert({ routine_id: routineId, completed: false })
        .select()
        .single()

      if (error) throw error

      const items = productIds.map((pid) => ({
        log_id: (log as UsageLog).id,
        product_id: pid,
        checked: false,
      }))

      const { error: itemsError } = await supabase
        .from('usage_log_items')
        .insert(items)

      if (itemsError) throw itemsError
      return log as UsageLog
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['usage_log_today', vars.routineId] })
    },
  })
}

// ── Marca/desmarca um produto no log ──────────────────────────────────────
export function useToggleLogItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      logItemId,
      checked,
      logId,
      routineId,
    }: {
      logItemId: string
      checked: boolean
      logId: string
      routineId: string
    }) => {
      const { error } = await supabase
        .from('usage_log_items')
        .update({ checked })
        .eq('id', logItemId)

      if (error) throw error

      // Verifica se todos estão marcados → atualiza log como completo
      const { data: allItems } = await supabase
        .from('usage_log_items')
        .select('checked')
        .eq('log_id', logId)

      const allDone = allItems?.every((i) => i.checked) ?? false

      await supabase
        .from('usage_logs')
        .update({ completed: allDone })
        .eq('id', logId)

      return { routineId }
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['usage_log_today', res.routineId] })
    },
  })
}

// ── Última foto de evolução ───────────────────────────────────────────────
export function useLastSkinPhoto() {
  return useQuery({
    queryKey: ['skin_progress_last'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skin_progress')
        .select('taken_at')
        .order('taken_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      return data as Pick<SkinProgress, 'taken_at'> | null
    },
  })
}

// ── Dias desde a última foto ──────────────────────────────────────────────
export function useDaysSinceLastPhoto() {
  const { data } = useLastSkinPhoto()
  if (!data) return null
  const diff = Date.now() - new Date(data.taken_at).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}
