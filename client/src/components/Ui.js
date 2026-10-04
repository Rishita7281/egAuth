import React from 'react';

export function SectionHeader({ title, subtitle, right }) {
  return (
    <div className="section-header">
      <div>
        <h2>{title}</h2>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </div>
      {right && <div className="section-right">{right}</div>}
    </div>
  );
}

export function Panel({ title, subtitle, children, right }) {
  return (
    <section className="panel">
      {(title || right) && (
        <div className="panel-head">
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <p className="panel-subtitle">{subtitle}</p>}
          </div>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function Field({ label, value, onChange, type = 'text', placeholder, as = 'input', rows = 4, children, ...props }) {
  const Component = as;
  return (
    <label className="field">
      <span>{label}</span>
      <Component
        className="field-control"
        type={as === 'input' ? type : undefined}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={as === 'textarea' ? rows : undefined}
        {...props}
      >
        {children}
      </Component>
    </label>
  );
}

export function Button({ children, variant = 'primary', as = 'button', ...props }) {
  const Component = as;
  return (
    <Component className={`btn ${variant}`} {...props}>
      {children}
    </Component>
  );
}

export function StatusPill({ tone = 'neutral', children }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}

export function DataTable({ columns, rows, emptyText = 'No records yet' }) {
  const gridTemplateColumns = `repeat(${Math.max(columns.length, 1)}, minmax(140px, 1fr))`;
  const minWidth = `${Math.max(columns.length, 1) * 140}px`;

  return (
    <div className="table">
      <div className="table-scroll">
        <div className="table-head" style={{ gridTemplateColumns, minWidth }}>
          {columns.map((col) => (
            <div key={col.key} className="table-cell">
              {col.label}
            </div>
          ))}
        </div>
        {rows.length === 0 ? (
          <div className="table-empty">{emptyText}</div>
        ) : (
          rows.map((row, idx) => (
            <div key={row.id || idx} className="table-row" style={{ gridTemplateColumns, minWidth }}>
              {columns.map((col) => (
                <div key={col.key} className="table-cell">
                  {row[col.key] ?? '-'}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}


