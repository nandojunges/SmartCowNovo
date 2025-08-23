// backend/resources/animals.resource.js
import db from '../dbx.js';
import { z, makeValidator } from '../validate.js';
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
  validateCreate: makeValidator(createSchema),
  validateUpdate: makeValidator(updateSchema),
  defaults: () => ({ created_at: new Date().toISOString() }),
};

export default makeCrudRouter(cfg, db);
