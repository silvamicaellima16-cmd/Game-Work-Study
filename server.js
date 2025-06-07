const express = require('express');
const fs = require('fs').promises;
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Funções para ler/escrever JSON
const readJson = async (file) => JSON.parse(await fs.readFile(file));
const writeJson = async (file, data) => await fs.writeFile(file, JSON.stringify(data, null, 2));

// Endpoint para usuários
app.get('/usuarios', async (req, res) => {
    try {
        const usuarios = await readJson('./usuarios.json');
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar usuários' });
    }
});

app.post('/usuarios', async (req, res) => {
    try {
        const usuarios = await readJson('./usuarios.json');
        const { nome, gmail, cpf, idade, cep } = req.body;
        if (!nome || !gmail || !cpf || !idade || !cep) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        }
        if (usuarios.find(u => u.cpf === cpf)) {
            return res.status(400).json({ error: 'CPF já cadastrado' });
        }
        const id_usuario = usuarios.length > 0 ? Math.max(...usuarios.map(u => u.id_usuario)) + 1 : 1;
        const usuario = { id_usuario, nome, gmail, cpf, idade, cep, is_admin: false };
        usuarios.push(usuario);
        await writeJson('./usuarios.json', usuarios);
        res.json({ id_usuario });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao cadastrar usuário' });
    }
});

// Endpoint para produtos
app.get('/produtos', async (req, res) => {
    try {
        const produtos = await readJson('./produtos.json');
        res.json(produtos);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar produtos' });
    }
});

app.post('/produtos', async (req, res) => {
    try {
        const produtos = await readJson('./produtos.json');
        const { nome, preco, imagem, estoque, descricao, id_categoria } = req.body;
        const id_produto = produtos.length > 0 ? Math.max(...produtos.map(p => p.id_produto)) + 1 : 1;
        const produto = { id_produto, nome, preco, imagem, estoque, descricao, id_categoria };
        produtos.push(produto);
        await writeJson('./produtos.json', produtos);
        res.json({ message: 'Produto adicionado' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao adicionar produto' });
    }
});

app.put('/produtos/:id', async (req, res) => {
    try {
        const produtos = await readJson('./produtos.json');
        const id = parseInt(req.params.id);
        const index = produtos.findIndex(p => p.id_produto === id);
        if (index === -1) return res.status(404).json({ error: 'Produto não encontrado' });
        produtos[index] = { ...produtos[index], ...req.body };
        await writeJson('./produtos.json', produtos);
        res.json({ message: 'Produto atualizado' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao editar produto' });
    }
});

app.delete('/produtos/:id', async (req, res) => {
    try {
        const produtos = await readJson('./produtos.json');
        const id = parseInt(req.params.id);
        const filtered = produtos.filter(p => p.id_produto !== id);
        await writeJson('./produtos.json', filtered);
        res.json({ message: 'Produto excluído' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir produto' });
    }
});

// Endpoint para categorias
app.get('/categorias', async (req, res) => {
    try {
        const produtos = await readJson('./produtos.json');
        const categorias = [
            { id_categoria: 1, nome: 'PCs Gamer' }
        ];
        const result = produtos.map(produto => ({
            ...produto,
            categoria: categorias.find(c => c.id_categoria === produto.id_categoria)?.nome || 'Sem categoria'
        }));
        res.json(categorias);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar categorias' });
    }
});

app.post('/categorias', async (req, res) => {
    try {
        const produtos = await readJson('./produtos.json');
        const { nome } = req.body;
        const categorias = [
            { id_categoria: 1, nome: 'PCs Gamer' }
        ];
        const id_categoria = categorias.length + 1;
        categorias.push({ id_categoria, nome });
        await writeJson('./produtos.json', produtos);
        res.json({ message: 'Categoria adicionada' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao adicionar categoria' });
    }
});

app.delete('/categorias/:id', async (req, res) => {
    try {
        res.json({ message: 'Categoria excluída' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir categoria' });
    }
});

// Endpoint para carrinho
app.get('/carrinho/:id_usuario', async (req, res) => {
    try {
        const carrinho = await readJson('./carrinho.json');
        const produtos = await readJson('./produtos.json');
        const id_usuario = req.params.id_usuario;
        const itens = carrinho.filter(item => item.id_usuario === id_usuario);
        const result = itens.map(item => {
            const produto = produtos.find(p => p.id_produto === parseInt(item.id_produto));
            return {
                id_produto: item.id_produto,
                nome: produto.nome,
                preco: produto.preco,
                quantidade: item.quantidade
            };
        });
        const total = result.reduce((sum, item) => sum + item.preco * item.quantidade, 0);
        res.json({ itens: result, total });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar carrinho' });
    }
});

app.post
   try {
    const carrinho = await readJson('./carrinho.json');
    const id_usuario = req.body.id_usuario;
    const id_produto = parseInt(req.body.id_produto);
    const quantidade = parseInt(req.body.quantidade);
    const index = carrinho.findIndex(item => item.id_usuario === id_usuario && item.id_produto === id_produto);
    if (index !== -1) {
        carrinho[index].quantidade += quantidade;
    } else {
        carrinho.push({ id_usuario, id_produto, quantidade });
    }
    await writeJson('./carrinho.json', carrinho);
    res.json({ message: 'Item adicionado ao carrinho' });
} catch (error) {
    res.status(500).json({ error: 'Erro ao adicionar ao carrinho' });
}

app.delete('/carrinho/:id_usuario/:id_produto', async (req, res) => {
    try {
        const carrinho = await readJson('./carrinho.json');
        const id_usuario = req.params.id_usuario;
        const id_produto = parseInt(req.params.id_produto);
        const filtered = carrinho.filter(item => !(item.id_usuario === id_usuario && item.id_produto === id_produto));
        await writeJson('./carrinho.json', filtered);
        res.json({ message: 'Item removido do carrinho' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao remover item do carrinho' });
    }
});

app.delete('/carrinho/:id_usuario', async (req, res) => {
    try {
        const id_usuario = req.params.id_usuario;
        const carrinho = await readJson('./carrinho.json');
        const filtered = carrinho.filter(item => item.id_usuario !== id_usuario);
        await writeJson('./carrinho.json', filtered);
        res.json({ message: 'Carrinho limpo' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao limpar carrinho' });
    }
});

// Endpoint para pedidos
app.post('/pedido', async (req, res) => {
    try {
        const pedidos = await readJson('./pedidos.json');
        const carrinho = await readJson('./carrinho.json');
        const produtos = await readJson('./produtos.json');
        const usuarios = await readJson('./usuarios.json');
        const { id_usuario, forma_pagamento } = req.body;
        const id_pedido = pedidos.length > 0 ? Math.max(...pedidos.map(p => p.id_pedido)) + 1 : 1;
        const itens = carrinho.filter(item => item.id_usuario === id_usuario).map(item => {
            const produto = produtos.find(p => p.id_produto === parseInt(item.id_produto));
            return {
                id_produto: item.id_produto,
                nome: produto.nome,
                quantidade: item.quantidade,
                preco_unitario: produto.preco
            };
        });
        const total = itens.reduce((sum, item) => sum + item.preco_unitario * item.quantidade, 0);
        const usuario = usuarios.find(u => u.id_usuario === parseInt(id_usuario));
        const pedido = {
            id_pedido,
            id_usuario,
            data_pedido: new Date().toISOString(),
            forma_pagamento,
            status: 'Pendente',
            usuario_nome: usuario ? usuario.nome : 'Desconhecido',
            total,
            itens
        };
        pedidos.push(pedido);
        await writeJson('./pedidos.json', pedidos);
        const filteredCarrinho = carrinho.filter(item => item.id_usuario !== id_usuario);
        await writeJson('./carrinho.json', filteredCarrinho);
        res.json({ message: 'Pedido finalizado' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao finalizar pedido' });
    }
});

app.get('/pedidos', async (req, res) => {
    try {
        const pedidos = await readJson('./pedidos.json');
        res.json(pedidos);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar pedidos' });
    }
});

app.get('/pedidos/:id/itens', async (req, res) => {
    try {
        const pedidos = await readJson('./pedidos.json');
        const id = parseInt(req.params.id);
        const pedido = pedidos.find(p => p.id_pedido === id);
        if (!pedido) return res.status(404).json({ error: 'Pedido não encontrado' });
        res.json(pedido.itens);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao listar itens do pedido' });
    }
});

// Iniciar servidor
app.listen(3000, () => console.log('Servidor rodando na porta 3000'));