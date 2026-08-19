document.addEventListener('DOMContentLoaded', () => {
    
    /* ==========================================================================
       0. SCROLL EVENT FOR HEADER SHADOW TRANSITION
       ========================================================================== */
    const mainHeader = document.querySelector('.main-header');
    if (mainHeader) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                mainHeader.classList.add('scrolled');
            } else {
                mainHeader.classList.remove('scrolled');
            }
        });
    }

    /* ==========================================================================
       1. CONTROL DEL MODAL DE INSCRIPCIÓN
       ========================================================================== */
    const enrollModal = document.getElementById('enroll-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnSuccessClose = document.getElementById('btn-success-close');
    const enrollButtons = document.querySelectorAll('.btn-enroll');
    const studentCourseSelect = document.getElementById('student-course');
    
    const modalFormStep = document.getElementById('modal-form-step');
    const modalSuccessStep = document.getElementById('modal-success-step');
    const leadForm = document.getElementById('lead-signup-form');

    // Configuración del destino de Google Sheets
    // REEMPLAZAR ESTA URL con la de tu Google Apps Script Web App desplegada
    const GOOGLE_SHEETS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw1kbtlLlz_A1671ezTnDiltc0zVUumHzyK9E6bWJugEj1cMqzG0ptCuaT8Zqu1IbEP/exec';

    // Función para abrir el modal
    const openModal = (courseName = '') => {
        enrollModal.classList.add('open');
        enrollModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden'; // Bloquear scroll de fondo

        // Seleccionar automáticamente el curso y mostrar el nombre en el modal
        if (studentCourseSelect) {
            studentCourseSelect.value = courseName || 'General (Próximos Cursos)';
        }
        const displayCourse = document.getElementById('modal-course-name-display');
        if (displayCourse) {
            displayCourse.textContent = courseName || 'General (Próximos Cursos)';
        }

        // Reiniciar los pasos
        modalFormStep.style.display = 'block';
        modalSuccessStep.style.display = 'none';
        leadForm.reset();
        
        // Resetear botón de envío
        const submitBtn = leadForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = 'Confirmar Registro ✦';
            submitBtn.disabled = false;
        }
    };

    // Función para cerrar el modal
    const closeModal = () => {
        enrollModal.classList.remove('open');
        enrollModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = 'auto'; // Restaurar scroll
    };

    // Agregar evento a los botones de "Inscribirme" de cada curso
    enrollButtons.forEach(button => {
        button.addEventListener('click', () => {
            const courseName = button.getAttribute('data-course');
            openModal(courseName);
        });
    });

    // Cerrar modal con la X
    if (btnCloseModal) {
        btnCloseModal.addEventListener('click', closeModal);
    }

    // Cerrar modal en la pantalla de éxito
    if (btnSuccessClose) {
        btnSuccessClose.addEventListener('click', closeModal);
    }

    // Cerrar al dar clic en el fondo
    enrollModal.addEventListener('click', (e) => {
        if (e.target === enrollModal) {
            closeModal();
        }
    });

    // Cerrar al presionar la tecla Esc
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && enrollModal.classList.contains('open')) {
            closeModal();
        }
    });

    /* ==========================================================================
       2. VALIDACIÓN Y ENVÍO DEL FORMULARIO DE LEADS A GOOGLE SHEETS
       ========================================================================== */
    if (leadForm) {
        leadForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Capturar datos del formulario
            const formData = new FormData(leadForm);
            const studentData = {
                firstName: formData.get('name'),
                lastName: formData.get('lastname'),
                phone: formData.get('phone'),
                email: formData.get('email'),
                course: formData.get('course'),
                consent: formData.get('consent'),
                registeredAt: new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })
            };

            // Cambiar estado del botón de envío
            const submitBtn = leadForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Confirmar Registro ✦';
            if (submitBtn) {
                submitBtn.innerHTML = 'Procesando...';
                submitBtn.disabled = true;
            }

            // Función para avanzar al paso de éxito
            const showSuccess = () => {
                // Configurar datos en la pantalla de éxito
                document.getElementById('success-student-name').textContent = studentData.firstName;
                document.getElementById('success-course-name').textContent = studentData.course;
                document.getElementById('success-phone').textContent = studentData.phone;

                // Alternar pasos
                modalFormStep.style.display = 'none';
                modalSuccessStep.style.display = 'flex';
                
                // Animación sutil de entrada
                modalSuccessStep.style.opacity = '0';
                setTimeout(() => {
                    modalSuccessStep.style.opacity = '1';
                    modalSuccessStep.style.transition = 'opacity 0.3s ease';
                }, 50);
            };

            // Enviar a Google Sheets
            if (GOOGLE_SHEETS_SCRIPT_URL && GOOGLE_SHEETS_SCRIPT_URL !== 'URL_DE_TU_GOOGLE_APPS_SCRIPT') {
                fetch(GOOGLE_SHEETS_SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors', // Permite el envío sin problemas de CORS en Apps Script
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(studentData)
                })
                .then(() => {
                    console.log('✓ Registro enviado a Google Sheets:', studentData);
                    // Respaldo en localStorage
                    const leads = JSON.parse(localStorage.getItem('metro_summer_leads') || '[]');
                    leads.push(studentData);
                    localStorage.setItem('metro_summer_leads', JSON.stringify(leads));
                    showSuccess();
                })
                .catch((error) => {
                    console.error('Error al enviar a Google Sheets:', error);
                    alert('Ocurrió un error al procesar tu inscripción. Inténtalo de nuevo.');
                    if (submitBtn) {
                        submitBtn.innerHTML = originalBtnText;
                        submitBtn.disabled = false;
                    }
                });
            } else {
                // Modo demostración / local si no hay URL configurada
                setTimeout(() => {
                    console.log('✓ [Modo Demo] Registro guardado en localStorage:', studentData);
                    const leads = JSON.parse(localStorage.getItem('metro_summer_leads') || '[]');
                    leads.push(studentData);
                    localStorage.setItem('metro_summer_leads', JSON.stringify(leads));
                    showSuccess();
                }, 1000);
            }
        });
    }

    /* ==========================================================================
       3. ACORDEÓN DE PREGUNTAS FRECUENTES (FAQ)
       ========================================================================== */
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const faqItem = question.parentElement;
            const isActive = faqItem.classList.contains('active');

            // Cerrar otros acordeones abiertos
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
                const icon = item.querySelector('.faq-icon');
                if (icon) icon.textContent = '+';
            });

            // Si no estaba activo, abrir el actual
            if (!isActive) {
                faqItem.classList.add('active');
                const icon = faqItem.querySelector('.faq-icon');
                if (icon) icon.textContent = '−';
            }
        });
    });

    /* ==========================================================================
       4. ANIMACIONES SUTILES AL HACER SCROLL (Intersection Observer)
       ========================================================================== */
    const animatedElements = document.querySelectorAll('.course-detail-block, .feature-item, .section-title-wrapper, .hero-header-block, .hero-intro-block');

    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(15px)';
        el.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
    });

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target); // Animación una única vez
            }
        });
    }, {
        threshold: 0.05,
        rootMargin: '0px 0px -40px 0px'
    });

    animatedElements.forEach(el => {
        scrollObserver.observe(el);
    });

    /* ==========================================================================
       6. FILTRADO DE TALLERES Y ENRUTADOR DE VISTA DE DETALLE LIMPIA
       ========================================================================== */
    const filterButtons = document.querySelectorAll('.filter-btn');
    const courseCards = document.querySelectorAll('.course-card');
    const emptyState = document.getElementById('courses-empty-state');
    const cardsGrid = document.getElementById('courses-cards-grid');
    const detailsWrapper = document.getElementById('courses-details-wrapper');
    const filterWrapper = document.querySelector('.filter-wrapper');
    const btnBackToGrid = document.getElementById('btn-back-to-grid');

    // Secciones a ocultar para simular una nueva página limpia
    const heroSection = document.querySelector('.hero-section');
    const experienceSection = document.querySelector('.experience-section');
    const faqSection = document.querySelector('.faq-section');
    const sectionTitle = document.querySelector('#cursos .section-title-wrapper');

    const showMainView = () => {
        if (heroSection) heroSection.style.display = 'block';
        if (experienceSection) experienceSection.style.display = 'block';
        if (faqSection) faqSection.style.display = 'block';
        if (filterWrapper) filterWrapper.style.display = 'block';
        if (sectionTitle) sectionTitle.style.display = 'block';
        if (detailsWrapper) detailsWrapper.style.display = 'none';

        // Sincronizar tarjetas según el filtro activo y corregir bug del empty state
        const activeFilter = document.querySelector('.filter-btn.active');
        if (activeFilter) {
            const filterValue = activeFilter.getAttribute('data-filter');
            let visibleCount = 0;
            
            courseCards.forEach(card => {
                const category = card.getAttribute('data-category');
                if (filterValue === 'all' || category === filterValue) {
                    card.style.display = 'flex';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });
            
            if (visibleCount === 0) {
                if (emptyState) emptyState.style.display = 'block';
                if (cardsGrid) cardsGrid.style.display = 'none';
            } else {
                if (emptyState) emptyState.style.display = 'none';
                if (cardsGrid) cardsGrid.style.display = 'grid';
            }
        }
    };

    const showDetailView = (courseId) => {
        const targetDetailBlock = document.getElementById(courseId);
        if (targetDetailBlock) {
            // Ocultar absolutamente todas las demás secciones del landing y el título de sección
            if (heroSection) heroSection.style.display = 'none';
            if (experienceSection) experienceSection.style.display = 'none';
            if (faqSection) faqSection.style.display = 'none';
            if (filterWrapper) filterWrapper.style.display = 'none';
            if (cardsGrid) cardsGrid.style.display = 'none';
            if (emptyState) emptyState.style.display = 'none';
            if (sectionTitle) sectionTitle.style.display = 'none';
            
            // Mostrar contenedor de detalles y el bloque específico
            if (detailsWrapper) detailsWrapper.style.display = 'block';
            document.querySelectorAll('.course-detail-block').forEach(block => {
                block.style.display = 'none';
            });
            targetDetailBlock.style.display = 'block';

            // Resetear el scroll al tope de la página
            window.scrollTo({
                top: 0,
                behavior: 'auto'
            });
        }
    };

    // Manejo de Filtros
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
            
            showMainView();

            // Animación sutil de entrada de las tarjetas
            const visibleCards = Array.from(courseCards).filter(c => c.style.display !== 'none');
            visibleCards.forEach(card => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(10px)';
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                    card.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
                }, 30);
            });
        });
    });

    // Abrir Vista Detallada al hacer click en Tarjeta
    courseCards.forEach(card => {
        card.addEventListener('click', () => {
            const courseId = card.getAttribute('data-course-id');
            showDetailView(courseId);
        });
    });

    // Botón Volver a Cursos
    if (btnBackToGrid) {
        btnBackToGrid.addEventListener('click', () => {
            showMainView();

            // Desplazar suavemente a la grilla de cursos
            const coursesSection = document.getElementById('cursos');
            if (coursesSection) {
                const header = document.querySelector('.main-header');
                const headerHeight = header ? header.offsetHeight : 80;
                const elementPosition = coursesSection.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    }

    // Interceptar clics en logo para regresar al home si está en vista detalle
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.addEventListener('click', (e) => {
            if (detailsWrapper && detailsWrapper.style.display === 'block') {
                e.preventDefault();
                showMainView();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    /* ==========================================================================
       7. NAVEGACIÓN SUAVE (SMOOTH SCROLL)
       ========================================================================== */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                
                // Si la vista de detalle está abierta, restaurar la principal antes del scroll
                if (detailsWrapper && detailsWrapper.style.display === 'block') {
                    showMainView();
                }
                
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});