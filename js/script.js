// VoxelForge 3D - script da loja (produtos, carrinho e cupom)

// ---------- variáveis ----------
const NOME_LOJA = "VoxelForge 3D";   // string
const VALOR_FRETE = 15.00;           // number
let freteGratis = false;             // boolean
let cupomAplicado = "";              // string
let porcentagemDesconto = 0;
let descontoFixo = 0;

// object com as regras da loja
const regrasLoja = {
    compraMinimaMenos20: 100.00,
    lojaAberta: true
};

// array com os produtos
const produtos = [
    {
        id: 1,
        nome: "Suporte Gamer de Headset Voronoi",
        preco: 64.90,
        imagem: "assets/suporte-headset.jpg",
        categoria: "Geek & Setup",
        promocao: true
    },
    {
        id: 2,
        nome: "Dragão Articulado (PLA Silk)",
        preco: 89.90,
        imagem: "assets/dragao-articulado.jpg",
        categoria: "Colecionáveis",
        promocao: true
    },
    {
        id: 3,
        nome: "Vaso Geométrico Low-Poly",
        preco: 45.00,
        imagem: "assets/vaso-low-poly.jpg",
        categoria: "Decoração",
        promocao: false
    },
    {
        id: 4,
        nome: "Kit 5 Engrenagens em ABS",
        preco: 52.50,
        imagem: "assets/engrenagens-abs.jpg",
        categoria: "Peças Técnicas",
        promocao: false
    },
    {
        id: 5,
        nome: "Action Figure Astronauta (Resina 8K)",
        preco: 135.00,
        imagem: "assets/astronauta-resina.jpg",
        categoria: "Colecionáveis",
        promocao: true
    },
    {
        id: 6,
        nome: "Dock para Controle e Celular",
        preco: 59.90,
        imagem: "assets/dock-controle.jpg",
        categoria: "Geek & Setup",
        promocao: false
    }
];

// array do carrinho, começa vazio
let carrinho = [];


// transforma o número em "R$ 0,00"
function formatarMoeda(valor) {
    if (typeof valor !== "number" || isNaN(valor)) {
        return "R$ 0,00";
    }
    return "R$ " + valor.toFixed(2).replace(".", ",");
}

// mostra uma mensagem de erro ou sucesso na tela
function mostrarMensagem(seletor, texto, tipo) {
    const elemento = document.querySelector(seletor);
    if (!elemento) return;

    elemento.textContent = texto;
    if (tipo === "erro") {
        elemento.className = "msg-feedback msg-erro";
    } else if (tipo === "sucesso") {
        elemento.className = "msg-feedback msg-sucesso";
    } else {
        elemento.className = "msg-feedback";
    }
}


// ---------- vitrine ----------

// cria os cards dos produtos na tela
function mostrarProdutos(lista) {
    const vitrine = document.getElementById("vitrine-produtos");
    vitrine.innerHTML = "";

    if (lista.length === 0) {
        vitrine.innerHTML = "<p class='vitrine-vazia'>Nenhum produto encontrado.</p>";
        return;
    }

    lista.forEach(function (produto) {
        const card = document.createElement("div");
        card.className = "produto";

        let selo = "";
        if (produto.promocao) {
            selo = '<span class="selo-promocao">Promoção</span>';
        }

        card.innerHTML = `
            ${selo}
            <img src="${produto.imagem}" alt="${produto.nome}">
            <span class="categoria-tag">${produto.categoria}</span>
            <h3>${produto.nome}</h3>
            <p class="preco-produto">${formatarMoeda(produto.preco)}</p>
            <button type="button" class="btn-adicionar" data-id="${produto.id}">Adicionar ao carrinho</button>
        `;

        vitrine.appendChild(card);
    });

    // coloca o evento de clique em cada botão de adicionar
    const botoes = document.querySelectorAll(".btn-adicionar");
    for (let i = 0; i < botoes.length; i++) {
        botoes[i].addEventListener("click", function (e) {
            const id = Number(e.currentTarget.getAttribute("data-id"));
            adicionarAoCarrinho(id);
        });
    }
}

// filtra pelo texto digitado e pela categoria
function filtrarProdutos() {
    const busca = document.getElementById("input-busca").value.trim().toLowerCase();
    const categoria = document.getElementById("select-categoria").value;

    const filtrados = produtos.filter(function (produto) {
        const achouNome = produto.nome.toLowerCase().includes(busca);
        const achouCategoria = categoria === "Todas" || produto.categoria === categoria;
        return achouNome && achouCategoria;
    });

    mostrarProdutos(filtrados);
}


// ---------- carrinho ----------

function adicionarAoCarrinho(id) {
    const produto = produtos.find(function (p) {
        return p.id === id;
    });

    if (!produto) {
        return;
    }

    // se já tem no carrinho só aumenta a quantidade
    const item = carrinho.find(function (p) {
        return p.id === id;
    });

    if (item) {
        item.quantidade++;
    } else {
        carrinho.push({
            id: produto.id,
            nome: produto.nome,
            categoria: produto.categoria,
            preco: produto.preco,
            quantidade: 1
        });
    }

    // esconde o recibo da compra anterior
    document.getElementById("recibo-pedido").className = "recibo-oculto";
    mostrarMensagem("#mensagem-compra", "", "");
    atualizarCarrinho();
}

// mudanca = 1 pra aumentar, -1 pra diminuir
function alterarQuantidade(id, mudanca) {
    const posicao = carrinho.findIndex(function (p) {
        return p.id === id;
    });

    if (posicao !== -1) {
        carrinho[posicao].quantidade += mudanca;

        // se chegou em 0 tira do carrinho
        if (carrinho[posicao].quantidade <= 0) {
            carrinho.splice(posicao, 1);
        }
    }

    conferirCupom();
    atualizarCarrinho();
}

function removerDoCarrinho(id) {
    carrinho = carrinho.filter(function (p) {
        return p.id !== id;
    });

    conferirCupom();
    atualizarCarrinho();
}

// depois de tirar itens, vê se o cupom ainda vale
function conferirCupom() {
    if (carrinho.length === 0) {
        cupomAplicado = "";
        porcentagemDesconto = 0;
        descontoFixo = 0;
        freteGratis = false;
        mostrarMensagem("#mensagem-cupom", "", "");
        return;
    }

    const subtotal = calcularTotal().subtotal;

    if (cupomAplicado === "MENOS20" && subtotal < regrasLoja.compraMinimaMenos20) {
        cupomAplicado = "";
        descontoFixo = 0;
        mostrarMensagem("#mensagem-cupom", "O cupom MENOS20 saiu porque a compra ficou abaixo de R$ 100,00.", "erro");
    }
}

// calcula subtotal, frete, desconto e total
function calcularTotal() {
    const subtotal = carrinho.reduce(function (soma, item) {
        return soma + item.preco * item.quantidade;
    }, 0);

    let totalItens = 0;
    for (const item of carrinho) {
        totalItens += item.quantidade;
    }

    let frete = 0;
    if (carrinho.length > 0 && !freteGratis) {
        frete = VALOR_FRETE;
    }

    let desconto = 0;
    if (porcentagemDesconto > 0) {
        desconto = subtotal * (porcentagemDesconto / 100);
    } else if (descontoFixo > 0) {
        desconto = descontoFixo;
    }

    let total = subtotal - desconto + frete;
    if (total < 0) {
        total = 0;
    }

    return {
        subtotal: subtotal,
        frete: frete,
        desconto: desconto,
        total: total,
        totalItens: totalItens
    };
}

// redesenha a tabela e os valores do resumo
function atualizarCarrinho() {
    const tabela = document.getElementById("corpo-tabela-carrinho");
    tabela.innerHTML = "";

    if (carrinho.length === 0) {
        tabela.innerHTML = `<tr><td colspan="6" class="carrinho-vazio">Seu carrinho está vazio.</td></tr>`;
    } else {
        carrinho.forEach(function (item) {
            const linha = document.createElement("tr");
            linha.innerHTML = `
                <td><strong>${item.nome}</strong></td>
                <td>${item.categoria}</td>
                <td>${formatarMoeda(item.preco)}</td>
                <td>
                    <button type="button" class="btn-qtd" data-acao="menos" data-id="${item.id}">-</button>
                    ${item.quantidade}
                    <button type="button" class="btn-qtd" data-acao="mais" data-id="${item.id}">+</button>
                </td>
                <td><strong>${formatarMoeda(item.preco * item.quantidade)}</strong></td>
                <td><button type="button" class="btn-remover" data-id="${item.id}">Remover</button></td>
            `;
            tabela.appendChild(linha);
        });
    }

    // eventos dos botões + e -
    tabela.querySelectorAll(".btn-qtd").forEach(function (botao) {
        botao.addEventListener("click", function (e) {
            const id = Number(e.currentTarget.getAttribute("data-id"));
            if (e.currentTarget.getAttribute("data-acao") === "mais") {
                alterarQuantidade(id, 1);
            } else {
                alterarQuantidade(id, -1);
            }
        });
    });

    // eventos dos botões de remover
    tabela.querySelectorAll(".btn-remover").forEach(function (botao) {
        botao.addEventListener("click", function (e) {
            removerDoCarrinho(Number(e.currentTarget.getAttribute("data-id")));
        });
    });

    const valores = calcularTotal();

    document.getElementById("valor-subtotal").textContent = formatarMoeda(valores.subtotal);

    if (freteGratis && carrinho.length > 0) {
        document.getElementById("valor-frete").textContent = "Grátis";
    } else {
        document.getElementById("valor-frete").textContent = formatarMoeda(valores.frete);
    }

    document.getElementById("valor-desconto").textContent = "- " + formatarMoeda(valores.desconto);
    document.getElementById("valor-total").textContent = formatarMoeda(valores.total);
    document.getElementById("nome-cupom-ativo").textContent = cupomAplicado || "Nenhum";

    // contador do menu e do botão flutuante
    document.getElementById("contador-menu").textContent = valores.totalItens;
    document.getElementById("badge-flutuante").textContent = valores.totalItens;
}


// ---------- cupom ----------

function aplicarCupom() {
    const codigo = document.getElementById("input-cupom").value.trim().toUpperCase();

    if (carrinho.length === 0) {
        mostrarMensagem("#mensagem-cupom", "Adicione algum produto antes de usar o cupom.", "erro");
        return;
    }

    if (codigo === "") {
        mostrarMensagem("#mensagem-cupom", "Digite um cupom.", "erro");
        return;
    }

    if (codigo === cupomAplicado) {
        mostrarMensagem("#mensagem-cupom", "Esse cupom já está aplicado.", "erro");
        return;
    }

    switch (codigo) {
        case "DESCONTO10":
            cupomAplicado = "DESCONTO10";
            porcentagemDesconto = 10;
            descontoFixo = 0;
            freteGratis = false;
            mostrarMensagem("#mensagem-cupom", "Cupom aplicado! 10% de desconto.", "sucesso");
            break;

        case "MENOS20":
            const subtotal = calcularTotal().subtotal;
            if (subtotal < regrasLoja.compraMinimaMenos20) {
                const falta = regrasLoja.compraMinimaMenos20 - subtotal;
                mostrarMensagem("#mensagem-cupom", "O MENOS20 só vale a partir de R$ 100,00. Faltam " + formatarMoeda(falta) + ".", "erro");
                return;
            }
            cupomAplicado = "MENOS20";
            porcentagemDesconto = 0;
            descontoFixo = 20.00;
            freteGratis = false;
            mostrarMensagem("#mensagem-cupom", "Cupom aplicado! R$ 20,00 de desconto.", "sucesso");
            break;

        case "FRETEGRATIS":
            cupomAplicado = "FRETEGRATIS";
            porcentagemDesconto = 0;
            descontoFixo = 0;
            freteGratis = true;
            mostrarMensagem("#mensagem-cupom", "Cupom aplicado! Frete grátis.", "sucesso");
            break;

        default:
            mostrarMensagem("#mensagem-cupom", "Cupom inválido.", "erro");
            return;
    }

    atualizarCarrinho();
}


// ---------- finalizar compra ----------

function finalizarCompra() {
    const recibo = document.getElementById("recibo-pedido");

    if (carrinho.length === 0) {
        mostrarMensagem("#mensagem-compra", "Seu carrinho está vazio!", "erro");
        recibo.className = "recibo-oculto";
        return;
    }

    const valores = calcularTotal();

    // número do pedido aleatório de 6 dígitos
    const numeroPedido = Math.floor(100000 + Math.random() * 900000);

    let itens = "<ul>";
    carrinho.forEach(function (item) {
        itens += "<li>" + item.quantidade + "x " + item.nome + " - " + formatarMoeda(item.preco * item.quantidade) + "</li>";
    });
    itens += "</ul>";

    let textoFrete = formatarMoeda(valores.frete);
    if (freteGratis) {
        textoFrete = "Grátis";
    }

    recibo.className = "recibo-visivel";
    recibo.innerHTML = `
        <h3>Pedido #${numeroPedido} confirmado!</h3>
        <p>Obrigado por comprar na ${NOME_LOJA}.</p>
        <h4>Itens:</h4>
        ${itens}
        <p>Subtotal: ${formatarMoeda(valores.subtotal)} | Desconto: - ${formatarMoeda(valores.desconto)} | Frete: ${textoFrete}</p>
        <p><strong>Total pago: ${formatarMoeda(valores.total)}</strong></p>
    `;

    // limpa tudo depois da compra
    carrinho = [];
    cupomAplicado = "";
    porcentagemDesconto = 0;
    descontoFixo = 0;
    freteGratis = false;
    document.getElementById("input-cupom").value = "";

    mostrarMensagem("#mensagem-cupom", "", "");
    mostrarMensagem("#mensagem-compra", "Compra finalizada!", "sucesso");
    atualizarCarrinho();
}


// ---------- eventos ----------

document.addEventListener("DOMContentLoaded", function () {
    mostrarProdutos(produtos);
    atualizarCarrinho();

    document.getElementById("btn-aplicar-cupom").addEventListener("click", aplicarCupom);
    document.getElementById("btn-finalizar-compra").addEventListener("click", finalizarCompra);
    document.getElementById("input-busca").addEventListener("input", filtrarProdutos);
    document.getElementById("select-categoria").addEventListener("change", filtrarProdutos);

    // apertar Enter no campo do cupom também aplica
    document.getElementById("input-cupom").addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            aplicarCupom();
        }
    });

    // formulário de contato
    const form = document.getElementById("form-contato");
    form.addEventListener("submit", function (e) {
        e.preventDefault(); // não deixa a página recarregar

        const nome = document.getElementById("nome-contato").value.trim();
        const email = document.getElementById("email-contato").value.trim();

        if (nome === "" || email === "") {
            mostrarMensagem("#feedback-contato", "Preencha todos os campos.", "erro");
            return;
        }

        mostrarMensagem("#feedback-contato", "Valeu, " + nome + "! Vamos responder no seu e-mail.", "sucesso");
        form.reset();
    });
});
