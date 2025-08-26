// backend/resources/animals.resource.js (ESM)
import db from '../dbx.js';
import { z } from '../validate.js';
import { makeValidator } from '../validate.js';
import { makeCrudRouter } from './crudRouter.js';

const createSchema = z.object({
  numero: z.string().optional(),
  brinco: z.string().optional(),
  nascimento: z.string().optional(), // dd/mm/aaaa (armazenado como TEXT)
  raca: z.string().optional(),
  estado: z.string().optional().default('vazia'),
  sexo: z.string().optional(),                  // 'femea' | 'macho'
  categoria: z.string().optional(),             // calculada no front, mas salvamos
  pai: z.string().optional(),
  mae: z.string().optional(),
  n_lactacoes: z.coerce.number().int().nonnegative().optional(),
  ultima_ia: z.string().optional(),             // dd/mm/aaaa
  parto: z.string().optional(),                 // dd/mm/aaaa (último parto)
  previsao_parto: z.string().optional(),        // dd/mm/aaaa
  historico: z.any().optional(),                // JSON com arrays (inseminacoes/partos/secagens)
});
const updateSchema = createSchema.partial();

const cfg = {
  table: 'animals',
  id: 'id',
  listFields: [
    'id','owner_id','numero','brinco','raca','estado','sexo','categoria',
    'n_lactacoes','pai','mae','nascimento','ultima_ia','parto','previsao_parto','created_at'
  ],
  searchFields: ['numero','brinco','raca','estado','pai','mae'],
  sortable: [
    'numero','brinco','raca','estado','sexo','categoria',
    'n_lactacoes','nascimento','ultima_ia','parto','previsao_parto','created_at'
  ],
  validateCreate: makeValidator(createSchema),
  validateUpdate: makeValidator(updateSchema),
  defaults: () => ({ created_at: new Date().toISOString() }),
  scope: { column: 'owner_id', required: true }, // 🔒 cada usuário vê/salva só o que é dele
};

const router = makeCrudRouter(cfg, db);
export default router;
