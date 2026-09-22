/*
 * Tudo relacionado a Aluno: formulário de cadastro/edição, validação de CPF,
 * comprovante (recibo), fila (Lista & Busca e Vagas e Ocupação).
 */
import { appState, API_URL, authHeaders } from './state.js';
import { showToast, showConfirm, showSuccessBanner } from './ui.js';
import { switchTabDirect, switchTab, renderAll, handleAuthResponse } from './auth.js';

function checkLaudo() {
    const laudoSelect = document.getElementById('studentLaudo');
    const laudoBox = document.getElementById('laudoBox');
    
    if (laudoSelect && laudoBox) {
        if (laudoSelect.value === 'Sim') {
            laudoBox.style.display = 'grid';
        } else {
            laudoBox.style.display = 'none';
            const laudoInput = document.getElementById('laudoDesc');
            if (laudoInput) laudoInput.value = '';
        }
    }
}

function checkIrmao() {
    const qty = parseInt(document.getElementById('studentIrmaoQty')?.value) || 0;
    const container = document.getElementById('irmaoBox');
    if (!container) return;
    
    container.innerHTML = '';
    if (qty > 0) {
        container.style.display = 'grid';
        for (let i = 1; i <= qty; i++) {
            container.innerHTML += `
                <div class="irmao-row" style="margin-top: 10px; display: flex; gap: 10px;">
                    <input type="text" id="irmaoNome${i}" placeholder="Nome do Irmão ${i}" required style="flex: 2;">
                    <input type="text" id="irmaoSerie${i}" placeholder="Série/Ano" required style="flex: 1;">
                </div>
            `;
        }
    } else {
        container.style.display = 'none';
    }
}


function validarCPF(cpf) {
    cpf = (cpf || '').replace(/\D/g, '');
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false; // ex: 111.111.111-11 (inválido apesar de ter 11 dígitos)

    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(cpf[i], 10) * (10 - i);
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf[9], 10)) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(cpf[i], 10) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf[10], 10)) return false;

    return true;
}

async function handleFormSubmit(event) {
    event.preventDefault();
    const irmaoQty = parseInt(document.getElementById('studentIrmaoQty')?.value) || 0;
    let irmaos = [];
    for (let i = 1; i <= irmaoQty; i++) {
        const nome = document.getElementById(`irmaoNome${i}`)?.value;
        const serie = document.getElementById(`irmaoSerie${i}`)?.value;
        if (nome && serie) irmaos.push({ nome, serie });
    }
    
    const payload = {
        category: document.getElementById('studentCategory')?.value,
        studentName: document.getElementById('studentName')?.value,
        studentBirth: document.getElementById('studentBirth')?.value || null,
        studentRg: document.getElementById('studentRg')?.value || null,
        studentCpf: document.getElementById('studentCpf')?.value || null,
        studentNat: document.getElementById('studentNat')?.value || null,
        studentGrade: document.getElementById('studentGrade')?.value,
        studentShift: document.getElementById('studentShift')?.value,
        studentLaudo: document.getElementById('studentLaudo')?.value,
        laudoDesc: document.getElementById('laudoDesc')?.value || null,
        irmaoQty: irmaoQty,
        irmaos: irmaos,
        respName: document.getElementById('respName')?.value,
        respBirth: document.getElementById('respBirth')?.value || null,
        respRg: document.getElementById('respRg')?.value || null,
        respCpf: document.getElementById('respCpf')?.value,
        respNat: document.getElementById('respNat')?.value || null,
        respAddress: document.getElementById('respAddress')?.value || null,
        respNum: document.getElementById('respNum')?.value || null,
        respBairro: document.getElementById('respBairro')?.value || null,
        respCep: document.getElementById('respCep')?.value || null,
        respCivil: document.getElementById('respCivil')?.value || null,
        respEduc: document.getElementById('respEduc')?.value || null,
        respEmail: document.getElementById('respEmail')?.value || null,
        respCompany: document.getElementById('respCompany')?.value || null,
        respCnpj: document.getElementById('respCnpj')?.value || null,
        telPai: document.getElementById('telPai')?.value || null,
        emailPai: document.getElementById('emailPai')?.value || null,
        telMae: document.getElementById('telMae')?.value || null,
        emailMae: document.getElementById('emailMae')?.value || null,
        telOutro: document.getElementById('telOutro')?.value || null,
        emailOutro: document.getElementById('emailOutro')?.value || null,
        respFin: document.getElementById('respFin')?.value,
        respAcad: document.getElementById('respAcad')?.value
    };

    if (!validarCPF(payload.respCpf)) {
        showToast('O CPF do responsável não é válido. Confira os números digitados.', 'error');
        return;
    }
    if (payload.studentCpf && !validarCPF(payload.studentCpf)) {
        showToast('O CPF do aluno não é válido. Confira os números digitados.', 'error');
        return;
    }

    const editingId = document.getElementById('editingId')?.value;
    const isEditing = !!editingId;
    const url = isEditing ? `${API_URL}/students/${editingId}` : `${API_URL}/students`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: authHeaders(),
            body: JSON.stringify(payload)
        });

        if (!handleAuthResponse(response)) return; // token expirado/inválido: já desloga sozinho

        if (response.ok) {
            const created = await response.json();
            cancelEdit(); // limpa o formulário e restaura o estado de "novo cadastro"

            if (isEditing) {
                showSuccessBanner('O cadastro foi atualizado com sucesso.', 'Cadastro atualizado!');
                renderAll();
            } else {
                await renderAll(); // atualiza appState.allStudents para já sabermos a posição/situação da vaga
                const registered = appState.allStudents.find((s) => s.id === created.id) || created;
                showSuccessBanner(
                    `${registered.studentName} foi cadastrado(a) na posição ${registered.position ? registered.position + 'º lugar' : '(a definir)'}.\nSituação: ${registered.status_vaga || 'Em processamento'}.\n\nO comprovante para impressão fica disponível a qualquer momento em "Lista & Busca" ou "Vagas e Ocupação".`,
                    'Cadastro realizado com sucesso!',
                    9000
                );
            }
        } else if (response.status === 400) {
            const errorData = await response.json();
            showToast(`Erro: ${errorData.detail}`, 'error'); // Exibe o erro do CPF duplicado
        } else {
            showToast('Erro ao salvar no banco. Verifique os campos.', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showToast('Não foi possível conectar ao servidor.', 'error');
    }
}

// --- BANNER DE SUCESSO (grande e centralizado, exibido após um novo cadastro) ---


function showReceipt(student) {
    const body = document.getElementById('receiptBody');
    if (!body) return;

    const irmaosHtml = (student.irmaos && student.irmaos.length > 0)
        ? `<p><strong>Irmãos na escola:</strong></p><ul>${student.irmaos.map((i) => `<li>${i.nome} — ${i.serie}</li>`).join('')}</ul>`
        : '';

    body.innerHTML = `
        <h4>Dados do Aluno</h4>
        <p><strong>Nome:</strong> ${student.studentName}</p>
        <p><strong>Categoria:</strong> ${student.category}</p>
        <p><strong>Série/Turno:</strong> ${student.studentGrade} / ${student.studentShift}</p>
        ${irmaosHtml}

        <h4>Responsável</h4>
        <p><strong>Nome:</strong> ${student.respName}</p>

        <h4>Situação na Fila</h4>
        <p><strong>Data/Hora do cadastro:</strong> ${student.timestamp}</p>
        <p><strong>Posição atual:</strong> ${student.position ? `${student.position}º lugar` : 'a definir'}</p>
        <p><strong>Situação:</strong> ${student.status_vaga || 'Em processamento'}</p>
        <p style="margin-top: 10px; color: #666; font-size: 0.9em;">A posição pode mudar conforme novos cadastros forem feitos, respeitando os critérios de prioridade do sistema.</p>
    `;

    const modal = document.getElementById('sesiReceiptModal');
    if (modal) modal.style.display = 'flex';
}

function closeReceipt() {
    const modal = document.getElementById('sesiReceiptModal');
    if (modal) modal.style.display = 'none';
}

function showReceiptById(id) {
    const student = appState.allStudents.find((s) => s.id === id);
    if (!student) {
        showToast('Cadastro não encontrado na lista atual. Atualize a página e tente novamente.', 'error');
        return;
    }
    showReceipt(student);
}

async function renderVagas() {
    const totalVagas = document.getElementById('totalVagasInput')?.value || 5;
    try {
        const response = await fetch(`${API_URL}/students/queue?total_vagas=${totalVagas}`, { headers: authHeaders() });
        if (!handleAuthResponse(response)) return; // token expirado/inválido: já desloga sozinho
        if (!response.ok) return;

        const sortedStudents = await response.json();
        appState.allStudents = sortedStudents; // cache usada pela busca/filtro e pela edição

        const tbody = document.getElementById('vagasTableBody');
        if (tbody) {
            if (sortedStudents.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhum aluno cadastrado.</td></tr>';
            } else {
                tbody.innerHTML = sortedStudents.map((s) => `
                    <tr>
                        <td><strong>${s.position}º</strong></td>
                        <td>${s.timestamp}</td>
                        <td>${s.studentName}</td>
                        <td>${s.category}</td>
                        <td><span class="status-vaga ${s.status_vaga === 'VAGA GARANTIDA' ? 'alocado' : 'espera'}">${s.status_vaga}</span></td>
                        <td>
                            <div class="table-actions">
                                <button class="btn-print" style="padding: 6px 12px; font-size: 0.85rem;" onclick="showReceiptById(${s.id})">Recibo</button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            }
        }

        // Também atualiza a aba "Lista & Busca", respeitando o filtro/busca já digitados
        filterTable();
    } catch (error) {
        console.error('Erro na fila:', error);
        showToast('Não foi possível carregar a fila de alunos.', 'error');
    }
}

// --- LISTA & BUSCA DE ALUNOS ---

function renderStudentsList(students) {
    const tbody = document.getElementById('studentTableBody');
    if (!tbody) return;

    if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhum cadastro encontrado.</td></tr>';
        return;
    }

    tbody.innerHTML = students.map((s) => `
        <tr>
            <td><strong>${s.position}º</strong></td>
            <td>${s.timestamp}</td>
            <td>${s.studentName}<br><span style="color: var(--text-muted); font-size: 0.85em;">${s.studentCpf || 'CPF não informado'}</span></td>
            <td>${s.studentGrade} / ${s.studentShift}</td>
            <td>${s.category}</td>
            <td>
                <div class="table-actions">
                    <button style="padding: 6px 12px; font-size: 0.85rem;" onclick="editStudent(${s.id})">Editar</button>
                    <button class="btn-print" style="padding: 6px 12px; font-size: 0.85rem;" onclick="showReceiptById(${s.id})">Recibo</button>
                    <button class="btn-danger" style="padding: 6px 12px; font-size: 0.85rem;" onclick="deleteStudent(${s.id})">Apagar</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filterTable() {
    const term = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();
    const category = document.getElementById('filterCategory')?.value || 'all';

    const filtered = appState.allStudents.filter((s) => {
        const matchesTerm = !term ||
            (s.studentName || '').toLowerCase().includes(term) ||
            (s.studentCpf || '').toLowerCase().includes(term);
        const matchesCategory = category === 'all' || s.category === category;
        return matchesTerm && matchesCategory;
    });

    renderStudentsList(filtered);
}

// Preenche o formulário de cadastro com os dados do aluno para edição (reaproveita o mesmo form)
function editStudent(id) {
    const student = appState.allStudents.find((s) => s.id === id);
    if (!student) {
        showToast('Cadastro não encontrado na lista atual. Atualize a página e tente novamente.', 'error');
        return;
    }

    const setVal = (elId, value) => {
        const el = document.getElementById(elId);
        if (el) el.value = value ?? '';
    };

    setVal('editingId', student.id);
    setVal('studentCategory', student.category);
    setVal('studentName', student.studentName);
    setVal('studentBirth', student.studentBirth);
    setVal('studentRg', student.studentRg);
    setVal('studentCpf', student.studentCpf);
    setVal('studentNat', student.studentNat);
    setVal('studentGrade', student.studentGrade);
    setVal('studentShift', student.studentShift);
    setVal('studentLaudo', student.studentLaudo);
    checkLaudo();
    setVal('laudoDesc', student.laudoDesc);

    setVal('studentIrmaoQty', student.irmaoQty || 0);
    checkIrmao();
    (student.irmaos || []).forEach((irmao, idx) => {
        setVal(`irmaoNome${idx + 1}`, irmao.nome);
        setVal(`irmaoSerie${idx + 1}`, irmao.serie);
    });

    setVal('respName', student.respName);
    setVal('respBirth', student.respBirth);
    setVal('respRg', student.respRg);
    setVal('respCpf', student.respCpf);
    setVal('respNat', student.respNat);
    setVal('respAddress', student.respAddress);
    setVal('respNum', student.respNum);
    setVal('respBairro', student.respBairro);
    setVal('respCep', student.respCep);
    setVal('respCivil', student.respCivil);
    setVal('respEduc', student.respEduc);
    setVal('respEmail', student.respEmail);
    setVal('respCompany', student.respCompany);
    setVal('respCnpj', student.respCnpj);
    setVal('telPai', student.telPai);
    setVal('emailPai', student.emailPai);
    setVal('telMae', student.telMae);
    setVal('emailMae', student.emailMae);
    setVal('telOutro', student.telOutro);
    setVal('emailOutro', student.emailOutro);
    setVal('respFin', student.respFin);
    setVal('respAcad', student.respAcad);

    document.getElementById('formTitle').textContent = 'Editando Cadastro';
    document.getElementById('formSubtitle').textContent = `Alterando os dados de ${student.studentName}. Salve para atualizar o cadastro.`;
    const btnSubmit = document.getElementById('btnSubmitForm');
    if (btnSubmit) btnSubmit.textContent = 'Atualizar Cadastro';
    const btnCancel = document.getElementById('btnCancelEdit');
    if (btnCancel) btnCancel.style.display = 'inline-block';

    // Lembra de onde o usuário veio, para que "Cancelar" volte para lá em vez de ficar no cadastro
    appState.editOriginTab = document.querySelector('.tab-content.active')?.id || null;

    switchTabDirect('tab-cadastro');
    document.getElementById('navCadastro')?.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEdit() {
    document.getElementById('studentForm')?.reset();
    document.getElementById('editingId').value = '';
    document.getElementById('formTitle').textContent = 'Formulário de Cadastro';
    document.getElementById('formSubtitle').textContent = 'Preencha os dados do requerente e do aluno abaixo.';
    const btnSubmit = document.getElementById('btnSubmitForm');
    if (btnSubmit) btnSubmit.textContent = 'Salvar Cadastro';
    const btnCancel = document.getElementById('btnCancelEdit');
    if (btnCancel) btnCancel.style.display = 'none';
    checkLaudo();
    checkIrmao();

    // Volta para a aba em que o usuário estava antes de iniciar a edição (ex: Lista & Busca)
    if (appState.editOriginTab && appState.editOriginTab !== 'tab-cadastro') {
        switchTab(null, appState.editOriginTab);
    }
    appState.editOriginTab = null;
}

async function deleteStudent(id) {
    const student = appState.allStudents.find((s) => s.id === id);
    const confirmed = await showConfirm(`Tem certeza que deseja apagar o cadastro de "${student ? student.studentName : 'este aluno'}"? Essa ação não pode ser desfeita.`);
    if (!confirmed) return;

    try {
        const response = await fetch(`${API_URL}/students/${id}`, { method: 'DELETE', headers: authHeaders() });
        if (!handleAuthResponse(response)) return; // token expirado/inválido: já desloga sozinho
        if (response.ok) {
            showSuccessBanner('O cadastro foi removido com sucesso.', 'Cadastro removido!');
            renderAll();
        } else {
            const err = await response.json();
            showToast(`Erro: ${err.detail}`, 'error');
        }
    } catch (error) {
        console.error('Erro ao apagar cadastro:', error);
        showToast('Não foi possível conectar ao servidor.', 'error');
    }
}


export {
    checkLaudo, checkIrmao, validarCPF, handleFormSubmit,
    showReceipt, closeReceipt, showReceiptById,
    renderVagas, renderStudentsList, filterTable, editStudent, cancelEdit, deleteStudent,
};