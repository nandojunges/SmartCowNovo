import db from '../dbx.js';
import { z } from '../validate.js';
import { makeValidator } from '../validate.js';
import { makeCrudRouter } from './crudRouter.js';

const FLAGS = {
  reproEvents: process.env.V1_ENABLE_REPRO_EVENTS === '1',
  healthEvents: process.env.V1_ENABLE_HEALTH_EVENTS === '1',
  stockMoves: process.env.V1_ENABLE_STOCK_MOVES === '1',
  financeEntries: process.env.V1_ENABLE_FINANCE === '1',
  milkRecords: process.env.V1_ENABLE_MILK === '1',
  sires: process.env.V1_ENABLE_SIRES === '1',
};

export default function register(app) {
  const dyn = [];

  if (FLAGS.sires) {
    dyn.push({
      path: 'sires',
      table: 'sires',
      id: 'id',
      schemaCreate: z.object({
        nome: z.string().min(1),
        codigo: z.string().optional(),
        raca: z.string().optional(),
        notas: z.string().optional(),
      }),
      schemaUpdate: null,
      listFields: ['id','owner_id','nome','codigo','raca','notas','created_at'],
      searchFields: ['nome','codigo','raca'],
      sortable: ['nome','created_at'],
    });
  }

  dyn.forEach(cfg => {
    app.use(`/api/v1/${cfg.path}`, makeCrudRouter({
      table: cfg.table,
      id: cfg.id,
      listFields: cfg.listFields,
      searchFields: cfg.searchFields,
      sortable: cfg.sortable,
      validateCreate: makeValidator(cfg.schemaCreate),
      validateUpdate: cfg.schemaUpdate ? makeValidator(cfg.schemaUpdate) : (req,res,next)=>next(),
      defaults: () => ({ created_at: new Date().toISOString() }),
      scope: { column: 'owner_id', required: true },
    }, db));
  });
}
