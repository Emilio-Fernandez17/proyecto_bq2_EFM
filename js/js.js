// ============================================
// APLICACIÓN BUSCADOR DE CÓCTELES - BLOQUE II
// ============================================

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado - Inicializando aplicación...');
    
    // ============================================
    // 1. INICIALIZACIÓN DE VARIABLES GLOBALES
    // ============================================
    const API_BASE = 'https://www.thecocktaildb.com/api/json/v1/1/';
    
    // Elementos del DOM
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const navMenu = document.getElementById('navMenu');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const randomBtn = document.getElementById('randomBtn');
    const resultsContainer = document.getElementById('resultsContainer');
    const alertArea = document.getElementById('alertArea');
    const resultsTitle = document.getElementById('resultsTitle');
    
    // ============================================
    // 3. MENÚ HAMBURGUESA (Requisito obligatorio)
    // ============================================
    if (hamburgerBtn && navMenu) {
        hamburgerBtn.addEventListener('click', function() {
            // Toggle del menú
            navMenu.classList.toggle('active');
            // Animación del botón hamburguesa
            this.classList.toggle('active');
            
            console.log('Menú hamburguesa ' + (navMenu.classList.contains('active') ? 'abierto' : 'cerrado'));
        });
        
        // Cerrar menú al hacer click en un enlace
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
                hamburgerBtn.classList.remove('active');
            });
        });
    }
    
    // ============================================
    // 2.1 BUSCADOR CON FETCH()
    // ============================================
    async function buscarCocktails() {
        const termino = searchInput.value.trim();
        
        // Validar entrada
        if (!termino) {
            mostrarAlerta('Por favor, introduce el nombre de un cóctel', 'warning');
            searchInput.focus();
            return;
        }
        
        // Limpiar resultados anteriores
        limpiarResultados();
        
        // Mostrar estado de carga
        mostrarEstadoCarga('Buscando cócteles...');
        
        try {
            console.log(`🔍 Buscando cócteles con término: "${termino}"`);
            
            // Petición fetch() a la API
            const respuesta = await fetch(`${API_BASE}search.php?s=${encodeURIComponent(termino)}`);
            
            // Verificar estado de la respuesta
            if (!respuesta.ok) {
                throw new Error(`Error HTTP ${respuesta.status}: ${respuesta.statusText}`);
            }
            
            // Convertir respuesta a JSON
            const datos = await respuesta.json();
            console.log('✅ Datos recibidos:', datos);
            
            // Verificar si hay resultados
            if (!datos.drinks || datos.drinks.length === 0) {
                // 2.5 - Mensaje si no hay resultados
                mostrarAlerta(`No se encontraron cócteles para "${termino}"`, 'info');
                mostrarSinResultados(termino);
                return;
            }
            
            // Mostrar resultados exitosos
            mostrarAlerta(`Se encontraron ${datos.drinks.length} cócteles para "${termino}"`, 'success');
            mostrarResultados(datos.drinks);
            actualizarTituloResultados(`Resultados para "${termino}"`);
            
        } catch (error) {
            // 2.5 - Manejo de errores de conexión
            console.error('❌ Error en la búsqueda:', error);
            mostrarAlerta(`Error de conexión: ${error.message}. Verifica tu conexión a internet.`, 'danger');
            mostrarErrorConexion();
        }
    }
    
    // ============================================
    // 2.2 RESULTADOS EN TARJETAS
    // ============================================
    function mostrarResultados(cocktails) {
        // Limpiar contenedor
        resultsContainer.innerHTML = '';
        
        // Crear tarjetas para cada cóctel
        cocktails.forEach((cocktail, index) => {
            // Crear elemento de tarjeta
            const col = document.createElement('div');
            col.className = 'col-md-6 col-lg-4 col-xl-3 mb-4';
            col.style.animationDelay = `${index * 0.1}s`;
            
            // Construir contenido de la tarjeta
            col.innerHTML = `
                <div class="card h-100 shadow">
                    <img src="${cocktail.strDrinkThumb || 'https://via.placeholder.com/300x300/667eea/ffffff?text=No+Imagen'}" 
                         class="card-img-top" 
                         alt="${cocktail.strDrink}"
                         loading="lazy">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${cocktail.strDrink}</h5>
                        <p class="card-text">
                            <span class="badge bg-primary mb-2">
                                <i class="bi bi-tag"></i> ${cocktail.strCategory || 'Sin categoría'}
                            </span>
                            <br>
                            <small class="text-muted">
                                <i class="bi bi-droplet"></i> ${cocktail.strAlcoholic || 'No especificado'}
                            </small>
                        </p>
                        <div class="mt-auto d-flex gap-2">
                            <button class="btn btn-outline-primary flex-grow-1 ver-detalle-btn" 
                                    data-id="${cocktail.idDrink}"
                                    data-bs-toggle="modal"
                                    data-bs-target="#cocktailModal">
                                <i class="bi bi-eye"></i> Ver más
                            </button>
                            <button class="btn btn-outline-warning favorito-btn"
                                    data-id="${cocktail.idDrink}"
                                    data-name="${cocktail.strDrink}"
                                    data-image="${cocktail.strDrinkThumb}">
                                <i class="bi bi-star"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            resultsContainer.appendChild(col);
        });
        
        // Añadir event listeners a los botones
        agregarEventListenersResultados();
    }
    
    // ============================================
    // 2.3 MODAL DE DETALLES
    // ============================================
    async function mostrarDetallesCocktail(id) {
        console.log(`📋 Solicitando detalles del cóctel ID: ${id}`);
        
        try {
            // Petición a la API para obtener detalles
            const respuesta = await fetch(`${API_BASE}lookup.php?i=${id}`);
            
            if (!respuesta.ok) {
                throw new Error('Error al obtener detalles');
            }
            
            const datos = await respuesta.json();
            
            if (!datos.drinks || datos.drinks.length === 0) {
                throw new Error('No se encontraron detalles del cóctel');
            }
            
            const cocktail = datos.drinks[0];
            
            // Construir lista de ingredientes
            let ingredientesHTML = '';
            for (let i = 1; i <= 15; i++) {
                const ingrediente = cocktail[`strIngredient${i}`];
                const medida = cocktail[`strMeasure${i}`];
                
                if (ingrediente && ingrediente.trim() !== '') {
                    ingredientesHTML += `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            <span>${ingrediente}</span>
                            <span class="badge bg-primary rounded-pill">${medida || 'Al gusto'}</span>
                        </li>
                    `;
                }
            }
            
            // Actualizar contenido del modal
            document.getElementById('modalTitle').textContent = cocktail.strDrink;
            document.getElementById('modalBody').innerHTML = `
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <img src="${cocktail.strDrinkThumb}" 
                             class="img-fluid rounded shadow" 
                             alt="${cocktail.strDrink}">
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <h6><i class="bi bi-tag"></i> <strong>Categoría:</strong></h6>
                            <p>${cocktail.strCategory || 'No disponible'}</p>
                        </div>
                        
                        <div class="mb-3">
                            <h6><i class="bi bi-droplet"></i> <strong>Tipo:</strong></h6>
                            <p>${cocktail.strAlcoholic || 'No especificado'}</p>
                        </div>
                        
                        <div class="mb-3">
                            <h6><i class="bi bi-globe"></i> <strong>Origen:</strong></h6>
                            <p>${cocktail.strArea || 'Internacional'}</p>
                        </div>
                        
                        <div class="mb-4">
                            <h6><i class="bi bi-journal-text"></i> <strong>Instrucciones:</strong></h6>
                            <p class="text-justify">${cocktail.strInstructions || 'No hay instrucciones disponibles.'}</p>
                        </div>
                        
                        <div class="mb-3">
                            <h6><i class="bi bi-list-check"></i> <strong>Ingredientes:</strong></h6>
                            <ul class="list-group">
                                ${ingredientesHTML || '<li class="list-group-item">No hay ingredientes listados</li>'}
                            </ul>
                        </div>
                        
                        ${cocktail.strVideo ? `
                        <div class="mt-3">
                            <a href="${cocktail.strVideo}" target="_blank" class="btn btn-danger">
                                <i class="bi bi-youtube"></i> Ver video tutorial
                            </a>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
            
        } catch (error) {
            console.error('Error al cargar detalles:', error);
            document.getElementById('modalBody').innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle"></i>
                    Error al cargar los detalles del cóctel: ${error.message}
                </div>
            `;
        }
    }
    
    // ============================================
    // 2.4 BÚSQUEDA ALEATORIA
    // ============================================
    async function buscarCocktailAleatorio() {
        console.log('🎲 Solicitando cóctel aleatorio...');
        
        // Limpiar resultados anteriores
        limpiarResultados();
        searchInput.value = '';
        
        // Mostrar estado de carga
        mostrarEstadoCarga('Obteniendo cóctel aleatorio...');
        
        try {
            // Petición fetch() para cóctel aleatorio
            const respuesta = await fetch(`${API_BASE}random.php`);
            
            if (!respuesta.ok) {
                throw new Error('Error al obtener cóctel aleatorio');
            }
            
            const datos = await respuesta.json();
            
            if (datos.drinks && datos.drinks.length > 0) {
                mostrarResultados(datos.drinks);
                mostrarAlerta('¡Cóctel aleatorio encontrado!', 'success');
                actualizarTituloResultados('Cóctel Aleatorio');
            } else {
                throw new Error('No se pudo obtener un cóctel aleatorio');
            }
            
        } catch (error) {
            console.error('Error en búsqueda aleatoria:', error);
            mostrarAlerta(`Error: ${error.message}`, 'danger');
            mostrarSinResultados('aleatorio');
        }
    }
    
    // ============================================
    // FUNCIONES AUXILIARES
    // ============================================
    
    // Mostrar alertas Bootstrap
    function mostrarAlerta(mensaje, tipo) {
        alertArea.innerHTML = `
            <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
                <div class="d-flex align-items-center">
                    <i class="bi ${tipo === 'success' ? 'bi-check-circle' : 
                                   tipo === 'warning' ? 'bi-exclamation-triangle' : 
                                   tipo === 'danger' ? 'bi-x-circle' : 'bi-info-circle'} 
                        me-2"></i>
                    <span>${mensaje}</span>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        
        // Auto-eliminar después de 5 segundos
        setTimeout(() => {
            const alerta = alertArea.querySelector('.alert');
            if (alerta) {
                const bsAlert = new bootstrap.Alert(alerta);
                bsAlert.close();
            }
        }, 5000);
    }
    
    // Mostrar estado de carga
    function mostrarEstadoCarga(mensaje) {
        resultsContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <h4 class="mt-4 text-muted">${mensaje}</h4>
            </div>
        `;
    }
    
    // Mostrar mensaje sin resultados
    function mostrarSinResultados(termino) {
        resultsContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-emoji-frown display-1 text-muted mb-3"></i>
                <h3 class="mb-3">No se encontraron resultados</h3>
                <p class="text-muted mb-4">
                    No hay cócteles que coincidan con "${termino}"
                </p>
                <button class="btn btn-primary" onclick="document.getElementById('randomBtn').click()">
                    <i class="bi bi-dice-5"></i> Prueba con un cóctel aleatorio
                </button>
            </div>
        `;
        actualizarTituloResultados('Sin resultados');
    }
    
    // Mostrar error de conexión
    function mostrarErrorConexion() {
        resultsContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-wifi-off display-1 text-danger mb-3"></i>
                <h3 class="mb-3">Error de conexión</h3>
                <p class="text-muted mb-4">
                    No se pudo conectar con el servidor. Verifica tu conexión a internet.
                </p>
                <button class="btn btn-outline-primary" onclick="location.reload()">
                    <i class="bi bi-arrow-clockwise"></i> Reintentar
                </button>
            </div>
        `;
        actualizarTituloResultados('Error de conexión');
    }
    
    // Limpiar resultados
    function limpiarResultados() {
        resultsContainer.innerHTML = '';
    }
    
    // Actualizar título de resultados
    function actualizarTituloResultados(texto) {
        if (resultsTitle) {
            resultsTitle.textContent = texto;
        }
    }
    
    // Agregar event listeners a los botones de resultados
    function agregarEventListenersResultados() {
        // Botones "Ver más"
        document.querySelectorAll('.ver-detalle-btn').forEach(boton => {
            boton.addEventListener('click', function() {
                const cocktailId = this.getAttribute('data-id');
                mostrarDetallesCocktail(cocktailId);
            });
        });
        
        // Botones "Favorito"
        document.querySelectorAll('.favorito-btn').forEach(boton => {
            boton.addEventListener('click', function() {
                const cocktailData = {
                    id: this.getAttribute('data-id'),
                    name: this.getAttribute('data-name'),
                    image: this.getAttribute('data-image')
                };
                agregarAFavoritos(cocktailData);
            });
        });
    }
    
    // Sistema de favoritos con localStorage (Extra)
    function agregarAFavoritos(cocktail) {
        // Inicializar favoritos si no existen
        if (!localStorage.getItem('cocktailFavorites')) {
            localStorage.setItem('cocktailFavorites', JSON.stringify([]));
        }
        
        // Obtener favoritos actuales
        const favoritos = JSON.parse(localStorage.getItem('cocktailFavorites'));
        
        // Verificar si ya está en favoritos
        const yaExiste = favoritos.some(fav => fav.id === cocktail.id);
        
        if (!yaExiste) {
            favoritos.push(cocktail);
            localStorage.setItem('cocktailFavorites', JSON.stringify(favoritos));
            
            // Feedback visual
            mostrarAlerta(`"${cocktail.name}" añadido a favoritos`, 'success');
            
            // Cambiar icono del botón
            const boton = document.querySelector(`.favorito-btn[data-id="${cocktail.id}"]`);
            if (boton) {
                boton.innerHTML = '<i class="bi bi-star-fill"></i>';
                boton.classList.remove('btn-outline-warning');
                boton.classList.add('btn-warning');
            }
        } else {
            mostrarAlerta(`"${cocktail.name}" ya está en favoritos`, 'info');
        }
    }
    
    // ============================================
    // ASIGNACIÓN DE EVENTOS
    // ============================================
    
    // Eventos del buscador
    if (searchBtn) {
        searchBtn.addEventListener('click', buscarCocktails);
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(evento) {
            if (evento.key === 'Enter') {
                buscarCocktails();
            }
        });
    }
    
    // Evento del botón aleatorio
    if (randomBtn) {
        randomBtn.addEventListener('click', buscarCocktailAleatorio);
    }
    
    // Evento para el modal (cargar detalles cuando se abre)
    const cocktailModal = document.getElementById('cocktailModal');
    if (cocktailModal) {
        cocktailModal.addEventListener('show.bs.modal', function(evento) {
            // El detalle se carga cuando se hace click en "Ver más"
            // Esta función ya está manejada por mostrarDetallesCocktail()
        });
    }
    
    // Inicializar favoritos
    if (!localStorage.getItem('cocktailFavorites')) {
        localStorage.setItem('cocktailFavorites', JSON.stringify([]));
    }
    
    // ============================================
    // CARGAR EJEMPLO INICIAL
    // ============================================
    // Cargar algunos cócteles al inicio
    window.addEventListener('load', function() {
        setTimeout(() => {
            searchInput.value = 'Margarita';
            buscarCocktails();
        }, 1000);
    });
    
    console.log('✅ Aplicación inicializada correctamente');
});

// ============================================
// FUNCIONES GLOBALES (para acceso desde HTML)
// ============================================
function recargarPagina() {
    location.reload();
}

function limpiarBusqueda() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
    }
}

