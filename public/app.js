let users = [];

async function init() {
  await loadUsers();
  await loadExpenses();
  await loadBalances();
  await loadSettlements();
}

async function loadUsers() {
  try {
    const res = await fetch('/users');
    const { data } = await res.json();
    users = data || [];
    
    document.getElementById('users-list').innerHTML = `
      <ul>${users.map(u => `<li>${u.name} (${u.email})</li>`).join('')}</ul>
    `;
    
    const payerSelect = document.getElementById('ex-payer');
    payerSelect.innerHTML = users.map(u => `<option value="${u._id}">${u.name}</option>`).join('');
    
    // reset participants
    document.getElementById('participants-container').innerHTML = '';
    if(users.length > 0) addParticipantRow();
  } catch(e) {
    console.error(e);
  }
}

document.getElementById('add-user-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('user-name').value;
  const email = document.getElementById('user-email').value;
  const password = document.getElementById('user-password').value;
  
  await fetch('/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  
  e.target.reset();
  await loadUsers();
});

document.getElementById('add-participant-btn').addEventListener('click', addParticipantRow);

function addParticipantRow() {
  const container = document.getElementById('participants-container');
  const div = document.createElement('div');
  div.className = 'participant-row';
  
  const select = document.createElement('select');
  select.className = 'participant-select';
  select.innerHTML = users.map(u => `<option value="${u._id}">${u.name}</option>`).join('');
  
  const numInput = document.createElement('input');
  numInput.type = 'number';
  numInput.className = 'participant-amount';
  numInput.placeholder = 'Amount (for UNEQUAL)';
  numInput.step = '0.01';
  
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.innerText = 'X';
  removeBtn.onclick = () => div.remove();
  
  div.appendChild(select);
  div.appendChild(numInput);
  div.appendChild(removeBtn);
  container.appendChild(div);
}

document.getElementById('add-expense-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const description = document.getElementById('ex-description').value;
  const totalAmount = parseFloat(document.getElementById('ex-amount').value);
  const payer = document.getElementById('ex-payer').value;
  const splitType = document.getElementById('ex-split-type').value;
  
  const rows = document.querySelectorAll('.participant-row');
  const participants = Array.from(rows).map(row => {
    return {
      user: row.querySelector('.participant-select').value,
      amountOwed: parseFloat(row.querySelector('.participant-amount').value) || undefined
    };
  });
  
  try {
    const res = await fetch('/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, totalAmount, payer, splitType, participants })
    });
    const result = await res.json();
    if(res.ok) {
        e.target.reset();
        document.getElementById('participants-container').innerHTML = '';
        addParticipantRow();
        alert('Expense Added Successfully!');
        
        await loadExpenses();
        await loadBalances();
        await loadSettlements();
    } else {
        alert('Error: ' + result.message);
    }
  } catch(err) {
    console.error(err);
    alert('Failed to add expense');
  }
});

async function loadExpenses() {
  try {
    const res = await fetch('/expenses');
    const { data } = await res.json();
    const list = document.getElementById('expenses-list');
    
    if(!data || data.length === 0) {
      list.innerHTML = '<p>No expenses found.</p>';
      return;
    }
    
    list.innerHTML = `
      <table>
        <tr>
          <th>Description</th>
          <th>Total</th>
          <th>Payer</th>
          <th>Type</th>
          <th>Date</th>
          <th>Action</th>
        </tr>
        ${data.map(exp => `
          <tr>
            <td>${exp.description}</td>
            <td>₹${exp.totalAmount}</td>
            <td>${exp.payer ? exp.payer.name : 'Unknown'}</td>
            <td>${exp.splitType}</td>
            <td>${new Date(exp.createdAt).toLocaleString()}</td>
            <td><button style="background-color: #dc3545; padding: 2px 5px;" onclick="deleteExpense('${exp._id}')">Delete</button></td>
          </tr>
        `).join('')}
      </table>
    `;
  } catch(e) { console.error(e); }
}

async function deleteExpense(id) {
    if(!confirm("Are you sure?")) return;
    await fetch(`/expenses/${id}`, { method: 'DELETE' });
    await loadExpenses();
    await loadBalances();
    await loadSettlements();
}

async function loadBalances() {
  try {
    const res = await fetch('/expenses/balances');
    const { data } = await res.json();
    const list = document.getElementById('balances-list');
    
    if(!data || data.length === 0) {
      list.innerHTML = '<p>No balances.</p>';
      return;
    }
    
    list.innerHTML = `<ul>${data.map(b => `<li>${b.message}</li>`).join('')}</ul>`;
  } catch(e) { console.error(e); }
}

async function loadSettlements() {
  try {
    const res = await fetch('/expenses/settlements');
    const { data } = await res.json();
    const list = document.getElementById('settlements-list');
    
    if(!data || data.length === 0) {
      list.innerHTML = '<p>All settled up!</p>';
      return;
    }
    
    list.innerHTML = `<ul>${data.map(s => `<li><strong>${s.message}</strong></li>`).join('')}</ul>`;
  } catch(e) { console.error(e); }
}

window.onload = init;
