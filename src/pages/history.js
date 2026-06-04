import { fmt, fmtd, calcProcessingUtil } from '../data.js';

let sortKey = null;
let sortDir = 1;

export function renderHistory(records, filteredRecs) {
  const recs = filteredRecs || records;
  let sorted = [...recs];

  if (sortKey) {
    sorted.sort((a, b) => {
      const va = a[sortKey] || 0, vb = b[sortKey] || 0;
      return (typeof va === 'string' ? va.localeCompare(vb) : va - vb) * sortDir;
    });
  }

  document.getElementById('histCount').textContent = `— ${sorted.length} record${sorted.length !== 1 ? 's' : ''}`;
  const tb = document.getElementById('histBody');

  if (!sorted.length) {
    const iconName = records.length ? 'search-off' : 'list';
    tb.innerHTML = `<tr><td colspan="20" style="text-align:center;color:var(--text-3);padding:2.5rem;font-size:13px">
      <i class="ti ti-${iconName}" style="font-size:28px;display:block;margin-bottom:10px;opacity:0.4"></i>
      ${records.length ? 'No records match your filter.' : 'No entries yet. Start with Daily Entry.'}
    </td></tr>`;
    return;
  }

  tb.innerHTML = [...sorted].reverse().map(r => {
    const util = calcProcessingUtil(r);
    const dateSafe = r.date.replace(/'/g, "\\'");
    const utilBadge = util >= 80 ? 'badge-green' : util >= 60 ? 'badge-blue' : 'badge-amber';
    return `<tr>
      <td><strong>${r.date}</strong></td>
      <td>₹${fmt(r.total_sale_value)}</td>
      <td>${fmt(r.total_sale_volume)}</td>
      <td>${r.routes || 0}</td>
      <td>₹${fmt(r.institution_sale)}</td>
      <td>${fmt(r.milk_received)}</td>
      <td>${fmtd(r.fat_pct)}</td>
      <td>${fmtd(r.snf_pct)}</td>
      <td>${fmtd(r.proc_rate)}</td>
      <td>${fmt(r.milk_processed)}</td>
      <td><span class="badge ${utilBadge}">${util}%</span></td>
      <td>${fmt(r.city_supply)}</td>
      <td>${fmt(r.dahi_sale)}</td>
      <td>${fmt(r.lassi_sale)}</td>
      <td>${fmt(r.paneer_sale)}</td>
      <td>${fmt(r.ghee_prod)}</td>
      <td>${fmt(r.milk_powder)}</td>
      <td>${fmt(r.ice_cream)}</td>
      <td>
        <button class="btn btn-xs btn-ghost" onclick="window.__editRec('${dateSafe}')" title="Edit">
          <i class="ti ti-edit"></i>
        </button>
      </td>
      <td>
        <button class="btn btn-xs btn-danger" onclick="window.__delRec('${dateSafe}')" title="Delete">
          <i class="ti ti-trash"></i>
        </button>
      </td>
    </tr>`;
  }).join('');
}

export function initHistorySort(onSort) {
  document.querySelectorAll('thead th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (sortKey === key) sortDir *= -1;
      else { sortKey = key; sortDir = 1; }
      onSort();
    });
  });
}
