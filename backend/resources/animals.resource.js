// backend/resources/animals.resource.js (ESM)
import db from '../dbx.js';
import { z } from '../validate.js';
import { makeValidator } from '../validate.js';
import { makeCrudRouter } from './crudRouter.js';

const createSchema = z.object({
  numero: z.string().optional(),
  brinco: z.string().optional(),
  nascimento: z.string().optional(), // yyyy-mm-dd
  raca: z.string().optional(),
  estado: z.string().default('vazia'),
  ultima_ia: z.string().optional(),
  parto: z.string().optional(),
});
const updateSchema = createSchema.partial();

const cfg = {
  table: 'animals',
  id: 'id',
  listFields: ['id','numero','brinco','raca','estado','nascimento','ultima_ia','parto','created_at'],
  searchFields: ['numero','brinco','raca','estado'],
  sortable: ['numero','brinco','raca','estado','nascimento','ultima_ia','parto','created_at'],
  validateCreate: makeValidator(createSchema),
  validateUpdate: makeValidator(updateSchema),
  defaults: () => ({ created_at: new Date().toISOString() }),
  scope: { column: 'owner_id', required: true }, // 🔒 cada usuário vê/salva só o que é dele
};

const router = makeCrudRouter(cfg, db);
export default router;
