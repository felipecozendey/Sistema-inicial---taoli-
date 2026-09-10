import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useSystemStore, type NewGlobalFoodInput } from '@/stores/useSystemStore'
import { FileSpreadsheet, Check, AlertCircle, Upload, Eye } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ParsedRow {
  index: number
  raw: string
  valid: boolean
  error?: string
  food?: NewGlobalFoodInput
}

const TACO_SAMPLE = `nome;categoria;unidade;calorias;carboidratos;proteínas;gorduras;fibras;sódio
Arroz integral cozido;Cereais;100g;124;25.8;2.6;1.0;2.7;1
Feijão preto cozido;Leguminosas;100g;77;14.0;4.5;0.5;8.4;2
Batata doce cozida;Tubérculos;100g;77;18.4;0.6;0.1;2.2;3
Peito de frango assado;Carnes;100g;163;0;31.5;3.2;0;53
Ovo de galinha cozido;Ovos;100g;146;0.6;13.3;9.5;0;146`

export function MasterFoodImportModal({ open, onOpenChange }: Props) {
  const { bulkImportFoods } = useSystemStore()
  const [csvText, setCsvText] = useState('')
  const [replaceExisting, setReplaceExisting] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewStep, setPreviewStep] = useState(false)

  const parseNumber = (val: string | undefined): number => {
    if (!val) return 0
    // Aceita vírgula ou ponto decimal
    const clean = val.replace(',', '.').replace(/[^\d.-]/g, '')
    const n = parseFloat(clean)
    return isNaN(n) ? 0 : Math.max(0, n)
  }

  const parsedResults = useMemo<ParsedRow[]>(() => {
    if (!csvText.trim()) return []

    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
    if (lines.length === 0) return []

    // Detect delimiter in first line (; or \t or ,)
    const firstLine = lines[0]
    let delimiter = ';'
    if (firstLine.includes('\t')) delimiter = '\t'
    else if (firstLine.includes(';') && !firstLine.includes('\t')) delimiter = ';'
    else if (firstLine.includes(',') && !firstLine.includes(';')) delimiter = ','

    // Check if first line is header
    const lowerFirst = firstLine.toLowerCase()
    const startIndex =
      lowerFirst.includes('nome') ||
      lowerFirst.includes('alimento') ||
      lowerFirst.includes('caloria') ||
      lowerFirst.includes('kcal')
        ? 1
        : 0

    const rows: ParsedRow[] = []

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i]
      const cols = line.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''))

      // Minimo 2 colunas: nome e calorias, ou padrão TACO 9 colunas
      // Ordem esperada padrão:
      // [0] nome
      // [1] categoria
      // [2] unidade
      // [3] calorias
      // [4] carboidratos
      // [5] proteínas
      // [6] gorduras
      // [7] fibras
      // [8] sódio
      const name = cols[0]
      if (!name) {
        rows.push({
          index: i + 1,
          raw: line,
          valid: false,
          error: 'Nome do alimento ausente',
        })
        continue
      }

      const category = cols[1] || 'Geral'
      const baseUnit = cols[2] || '100g'
      const calories = parseNumber(cols[3])
      const carbsG = parseNumber(cols[4])
      const proteinG = parseNumber(cols[5])
      const fatG = parseNumber(cols[6])
      const fibersG = parseNumber(cols[7])
      const sodiumMg = parseNumber(cols[8])

      rows.push({
        index: i + 1,
        raw: line,
        valid: true,
        food: {
          name,
          category,
          baseUnit,
          calories,
          carbsG,
          proteinG,
          fatG,
          fibersG,
          sodiumMg,
          allergens: null,
          tags: ['taco', 'importado'],
          isActive: true,
        },
      })
    }

    return rows
  }, [csvText])

  const validRows = useMemo(
    () => parsedResults.filter((r) => r.valid && r.food).map((r) => r.food!),
    [parsedResults],
  )
  const invalidRows = useMemo(() => parsedResults.filter((r) => !r.valid), [parsedResults])

  const handleApplySample = () => {
    setCsvText(TACO_SAMPLE)
  }

  const handleImport = async () => {
    if (validRows.length === 0) {
      toast.error('Nenhum alimento válido para importar')
      return
    }

    setIsSubmitting(true)
    try {
      await bulkImportFoods(validRows, replaceExisting)
      onOpenChange(false)
      setCsvText('')
      setPreviewStep(false)
    } catch {
      // toast já emitido pela store
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setPreviewStep(false)
        }
        onOpenChange(v)
      }}
    >
      <DialogContent className="max-w-2xl rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-[#1CB0F6]/10 text-[#1CB0F6] border-2 border-[#1CB0F6]/30">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <DialogTitle className="text-xl font-black">
                Importação em Lote de Alimentos (TACO / IBGE)
              </DialogTitle>
              <DialogDescription className="text-xs font-semibold">
                Cole dados tabulares (CSV/TSV separados por ponto-e-vírgula ou tabulação)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {!previewStep ? (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-muted-foreground">
                Colunas esperadas:{' '}
                <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] text-foreground font-mono">
                  nome;categoria;unidade;calorias;carboidratos;proteínas;gorduras;fibras;sódio
                </code>
              </span>
              <button
                type="button"
                onClick={handleApplySample}
                className="text-[#1CB0F6] font-black hover:underline"
              >
                Colar Exemplo TACO
              </button>
            </div>

            <Textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Cole aqui o conteúdo copiado de sua planilha Excel, CSV ou tabela TACO..."
              rows={9}
              className="font-mono text-xs rounded-2xl border-2 p-3 bg-card"
            />

            <div className="flex items-center space-x-2 pt-1">
              <Checkbox
                id="replace-foods"
                checked={replaceExisting}
                onCheckedChange={(c) => setReplaceExisting(Boolean(c))}
                className="rounded-lg"
              />
              <Label
                htmlFor="replace-foods"
                className="text-xs font-bold leading-none cursor-pointer"
              >
                Substituir alimentos existentes com o mesmo nome (Upsert)
              </Label>
            </div>

            <div className="pt-2 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-1/3 rounded-2xl h-12 font-bold border-2"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={!csvText.trim()}
                onClick={() => setPreviewStep(true)}
                className="flex-1 rounded-2xl h-12 font-black bg-[#1CB0F6] hover:bg-[#1899D6] text-white border-b-4 border-[#1479AB] active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                <span>Visualizar Preview ({parsedResults.length} linhas)</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {/* Status summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center gap-2.5">
                <Check className="w-5 h-5 text-emerald-600" />
                <div>
                  <div className="text-lg font-black text-emerald-600">{validRows.length}</div>
                  <div className="text-xs font-bold text-muted-foreground">Linhas Válidas</div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-rose-500/10 border-2 border-rose-500/30 flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <div>
                  <div className="text-lg font-black text-rose-600">{invalidRows.length}</div>
                  <div className="text-xs font-bold text-muted-foreground">Linhas Inválidas</div>
                </div>
              </div>
            </div>

            {/* Table preview */}
            <div className="border-2 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-muted/60 font-black text-[11px] text-muted-foreground uppercase">
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">Nome</th>
                    <th className="p-2.5">Categoria</th>
                    <th className="p-2.5 text-right">kcal</th>
                    <th className="p-2.5 text-right">Carb</th>
                    <th className="p-2.5 text-right">Prot</th>
                    <th className="p-2.5 text-right">Gord</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {validRows.slice(0, 15).map((food, i) => (
                    <tr key={i} className="hover:bg-muted/30">
                      <td className="p-2.5 font-mono text-muted-foreground">{i + 1}</td>
                      <td className="p-2.5 font-bold truncate max-w-[160px]">{food.name}</td>
                      <td className="p-2.5 text-muted-foreground">{food.category}</td>
                      <td className="p-2.5 text-right font-extrabold text-[#FF4B4B]">
                        {food.calories}
                      </td>
                      <td className="p-2.5 text-right font-bold text-[#FFC800]">{food.carbsG}g</td>
                      <td className="p-2.5 text-right font-bold text-[#58CC02]">
                        {food.proteinG}g
                      </td>
                      <td className="p-2.5 text-right font-bold text-[#1CB0F6]">{food.fatG}g</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {validRows.length > 15 && (
                <div className="p-2 text-center text-xs text-muted-foreground bg-muted/20 font-bold">
                  + {validRows.length - 15} outros alimentos prontos para importação
                </div>
              )}
            </div>

            <div className="pt-2 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPreviewStep(false)}
                className="w-1/3 rounded-2xl h-12 font-bold border-2"
              >
                Voltar e Editar
              </Button>
              <Button
                type="button"
                disabled={isSubmitting || validRows.length === 0}
                onClick={handleImport}
                className="flex-1 rounded-2xl h-12 font-black bg-[#58CC02] hover:bg-[#46B302] text-white border-b-4 border-[#46A602] active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Importando...'
                    : `Confirmar e Importar ${validRows.length} Alimentos`}
                </span>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
