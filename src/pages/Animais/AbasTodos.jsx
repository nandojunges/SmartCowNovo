import React, { useState, useMemo, useCallback } from 'react';

function Tabs({ selected, setSelected }) {
  const tabs = useMemo(() => ([
    { id: 'plantel', label: 'Plantel', img: '/icones/plantel.png' },
    { id: 'secagem', label: 'Secagem', img: '/icones/secagem.png' },
    { id: 'parto',   label: 'Parto',   img: '/icones/parto.png'   },
  ]), []);

  const onKey = useCallback((e) => {
    const idx = tabs.findIndex(t => t.id === selected);
    if (idx === -1) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = tabs[(idx + 1) % tabs.length];
      setSelected(next.id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = tabs[(idx - 1 + tabs.length) % tabs.length];
      setSelected(prev.id);
    }
  }, [selected, setSelected, tabs]);

  return (
    <div
      role="tablist"
      aria-label="Sub-abas de animais"
      className="flex justify-start items-center"
      style={{ gap: 28, marginTop: 20, marginBottom: 16 }}
      onKeyDown={onKey}
    >
      {tabs.map(t => {
        const active = selected === t.id;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            aria-controls={`pane-${t.id}`}
            onClick={() => setSelected(t.id)}
            title={t.label}
            className="bg-transparent border-0 outline-none focus:outline-none"
            style={{
              cursor: 'pointer',
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 110,
            }}
            tabIndex={active ? 0 : -1}
          >
            <img
              src={t.img}
              alt=""
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
              style={{
                width: 66,                 // 🔹 maior
                height: 66,                // 🔹 maior
                objectFit: 'contain',
                borderRadius: 9999,
                boxShadow: active ? '0 0 0 5px rgba(30,64,175,0.30)' : 'none', // “anel” azul no ativo
                transition: 'transform .2s ease, box-shadow .2s ease, filter .2s ease',
                transform: active ? 'scale(1.0)' : 'scale(0.97)',
                filter: active ? 'saturate(1.06)' : 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.filter = 'drop-shadow(0 6px 10px rgba(0,0,0,.18))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = active ? 'scale(1.0)' : 'scale(0.97)';
                e.currentTarget.style.filter = active ? 'saturate(1.06)' : 'none';
              }}
            />
            <span
              style={{
                marginTop: 10,
                fontSize: 15,              // 🔹 texto um pouco maior
                fontWeight: active ? 700 : 500,
                color: active ? '#1e3a8a' : '#111827',
                textAlign: 'center',
                lineHeight: 1.1,
                letterSpacing: 0.2,
                userSelect: 'none',
              }}
            >
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function AbasTodos({ animais, onRefresh, components, componentes }) {
  const maps = components || componentes || {};
  const [tab, setTab] = useState('plantel');
  const Comp = maps[tab];

  return (
    <div className="w-full">
      <Tabs selected={tab} setSelected={setTab} />
      <div className="mt-2 px-4" id={`pane-${tab}`} role="tabpanel" aria-labelledby={tab}>
        {Comp ? <Comp animais={animais} onRefresh={onRefresh} /> : null}
      </div>
    </div>
  );
}
