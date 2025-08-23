// backend/resources/products.resource.js
import db from '../dbx.js';
import { z, makeValidator } from '../validate.js';
import { makeCrudRouter } from './crudRouter.js';

const createSchema = z.object({
  nome: z.string().min(1),
  categoria: z.string().optional(),
  unidade: z.string().optional(),     // kg, L, mL, un
  preco_unit: z.number().optional(),
  quantidade: z.number().optional(),
  validade: z.string().optional(),    // yyyy-mm-dd
});

const updateSchema = createSchema.partial();

const cfg = {
  table: 'products',
  id: 'id',
  listFields: ['id','nome','categoria','unidade','preco_unit','quantidade','validade','created_at'],
  validateCreate: makeValidator(createSchema),
  validateUpdate: makeValidator(updateSchema),
  defaults: () => ({ created_at: new Date().toISOString() }),
};

export default makeCrudRouter(cfg, db);
