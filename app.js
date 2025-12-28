let enrollmentData = [];

// Load data
fetch('./data.json')
  .then(response => {
    if (!response.ok) {
      throw new Error("HTTP error " + response.status);
    }
    return response.json();
  })
  .then(data => {
    enrollmentData = data;
    populateDropdown();
  })
  .catch(err => console.error("Failed to load JSON:", err));

// Populate the dropdown with resident districts
function populateDropdown() {
  const select = document.getElementById('districtSelect');
  const districts = [...new Set(enrollmentData.map(row => row.resident))].sort();

  districts.forEach(district => {
    const option = document.createElement('option');
    option.value = district;
    option.textContent = district;
    select.appendChild(option);
  });
}

// Handle dropdown change
document.getElementById('districtSelect').addEventListener('change', function () {
  const selectedDistrict = this.value;
  const tbody = document.querySelector('#resultsTable tbody');
  const chart = document.getElementById('chart');

  tbody.innerHTML = '';
  chart.innerHTML = '';

  if (!selectedDistrict) return;

  const leavingTotals = {};
  const incomingTotals = {};

  enrollmentData.forEach(row => {
    if (row.resident === selectedDistrict) {
      leavingTotals[row.enrolling] = (leavingTotals[row.enrolling] || 0) + row.count;
    }
    if (row.enrolling === selectedDistrict) {
      incomingTotals[row.resident] = (incomingTotals[row.resident] || 0) + row.count;
    }
  });

  const allDistricts = new Set([
    ...Object.keys(leavingTotals),
    ...Object.keys(incomingTotals)
  ]);

  let totalLeaving = 0;
  let totalNet = 0;

  allDistricts.forEach(district => {
    const leaving = leavingTotals[district] || 0;
    const incoming = incomingTotals[district] || 0;
    const net = incoming - leaving;

    totalLeaving += leaving;
    totalNet += net;

    // Table row
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${district}</td>
      <td>${leaving}</td>
      <td>${net}</td>
    `;

    const netCell = tr.querySelector('td:last-child');
    netCell.className = net > 0 ? 'positive' : net < 0 ? 'negative' : 'neutral';

    tbody.appendChild(tr);

    // Chart bar
    const bar = document.createElement('div');
    bar.className = 'bar';

    const label = document.createElement('div');
    label.className = 'bar-label';
    label.textContent = district;

    const fill = document.createElement('div');
    fill.className = `bar-fill ${net >= 0 ? 'bar-positive' : 'bar-negative'}`;
    fill.style.width = Math.min(Math.abs(net) * 4, 300) + 'px';

    bar.appendChild(label);
    bar.appendChild(fill);
    chart.appendChild(bar);
  });

  document.getElementById('totalLeaving').textContent = totalLeaving;
  document.getElementById('totalNet').textContent = totalNet;
});


document.getElementById('searchInput').addEventListener('input', function () {
  const search = this.value.toLowerCase();
  const select = document.getElementById('districtSelect');

  Array.from(select.options).forEach(option => {
    if (!option.value) return;
    option.style.display = option.value.toLowerCase().includes(search)
      ? ''
      : 'none';
  });
});

