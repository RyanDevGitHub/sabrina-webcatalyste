  // === DONNÉES & ÉTAT DE L'APPLICATION ===

        // Array des images (maintenu)
        const images = [
            { src: "/res/unnamed.jpg", alt: "Photo principale du salon (1/5)" },
            { src: "/res/unnamed.jpg", alt: "Intérieur du salon (2/5)" },
            { src: "/res/unnamed-2.jpg", alt: "Exemple de coiffure 1 (3/5)" },
            { src: "/res/unnamed-3.jpg", alt: "Exemple de coiffure 2 (4/5)" },
            { src: "/res/unnamed-4.jpg", alt: "Exemple de coiffure 3 (5/5)" },
        ];
        
        // Horaires d'ouverture (0=Dimanche, 1=Lundi, ..., 6=Samedi)
        const OPENING_HOURS = {
            0: 'Fermé', 1: 'Fermé', 
            2: { open: '10:00', close: '19:00' }, 3: { open: '10:00', close: '19:00' }, 
            4: { open: '10:00', close: '19:00' }, 5: { open: '10:00', close: '19:00' }, 
            6: { open: '10:00', close: '18:00' }, 
        };
        const MONTH_NAMES = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

        let currentImageIndex = 0; 
        let currentMonthDate = new Date(); 
        
        // État de la réservation
        let selectedService = { name: null, price: null };
        let selectedDate = new Date();      
        let selectedTimeSlot = null;        
        
        // Références DOM
        const modal = document.getElementById('lightbox-modal');
        const modalContent = document.getElementById('lightbox-content');
        const modalImage = document.getElementById('lightbox-image');
        const modalCaption = document.getElementById('lightbox-caption');
        
        const calendarContainer = document.getElementById('calendar-grid');
        const monthYearDisplay = document.getElementById('month-year-display');
        const slotsContainer = document.getElementById('time-slots-container');
        const reservationSummary = document.getElementById('reservation-summary');
        const confirmButton = document.getElementById('confirm-button');
        const loader = document.getElementById('reservation-loader');
        
        // Réinitialiser la date sélectionnée à aujourd'hui
        selectedDate.setHours(0, 0, 0, 0); 
        
        // === LOGIQUE DE RÉSERVATION ===

        /**
         * Met à jour l'état de la prestation sélectionnée.
         */
        function selectService(name, price) {
            selectedService.name = name;
            selectedService.price = price;
            updateReservationSummary();
            
            // Mise en évidence du bouton choisi (UX)
            document.querySelectorAll('.service-card button').forEach(btn => {
                btn.textContent = 'Choisir';
                btn.classList.remove('bg-violet-600', 'text-white');
            });
            event.target.textContent = 'Sélectionné';
            event.target.classList.add('bg-violet-600', 'text-white');
        }

        /**
         * Met à jour le résumé de la réservation affiché en bas de page et active/désactive le bouton de confirmation.
         */
        function updateReservationSummary() {
            const dateOptions = { weekday: 'short', month: 'short', day: 'numeric' };
            const dateStr = selectedDate ? selectedDate.toLocaleDateString('fr-FR', dateOptions) : '*Aucune*';
            const timeStr = selectedTimeSlot || '*Aucune*';
            const serviceStr = selectedService.name || '*Aucune*';
            
            reservationSummary.textContent = `Prestation: ${serviceStr} | Date: ${dateStr} | Heure: ${timeStr}`;

            // Activation/Désactivation du bouton de confirmation
            if (selectedService.name && selectedDate && selectedTimeSlot) {
                confirmButton.disabled = false;
            } else {
                confirmButton.disabled = true;
            }
        }

        /**
         * Sélectionne un jour dans le calendrier.
         */
        function selectDay(year, month, day) {
            const newDate = new Date(year, month, day);
            newDate.setHours(0, 0, 0, 0); 

            const dayOfWeek = (newDate.getDay() + 6) % 7; // Lundi=0, Dimanche=6
            
            // Vérification de la validité du jour
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (OPENING_HOURS[dayOfWeek] === 'Fermé' || newDate < today) {
                return; 
            }

            selectedDate = newDate;
            selectedTimeSlot = null; // Réinitialiser le créneau horaire
            renderCalendar(); 
            renderTimeSlots(newDate);
            updateReservationSummary();
        }
        
        /**
         * Génère et affiche les créneaux horaires disponibles.
         */
        function renderTimeSlots(date) {
            slotsContainer.innerHTML = '';
            
            const dayOfWeek = (date.getDay() + 6) % 7; 
            const schedule = OPENING_HOURS[dayOfWeek];
            
            if (!schedule || schedule === 'Fermé') {
                slotsContainer.innerHTML = '<p class="text-red-500 text-center py-10 font-medium">Le salon est fermé ce jour-là.</p>';
                return;
            }

            const [openHour, openMinute] = schedule.open.split(':').map(Number);
            const [closeHour, closeMinute] = schedule.close.split(':').map(Number);

            let currentTime = new Date(date);
            currentTime.setHours(openHour, openMinute, 0, 0);
            
            let closingTime = new Date(date);
            closingTime.setHours(closeHour, closeMinute, 0, 0);

            let slotsFound = false;
            
            while (currentTime < closingTime) {
                const hour = String(currentTime.getHours()).padStart(2, '0');
                const minute = String(currentTime.getMinutes()).padStart(2, '0');
                const slotTime = `${hour}:${minute}`;

                const slotEl = document.createElement('button');
                slotEl.textContent = slotTime;
                slotEl.className = 'slot-button text-gray-700 hover:text-white hover:bg-violet-600';
                slotEl.onclick = () => selectTimeSlot(slotTime, slotEl);
                
                if (slotTime === selectedTimeSlot) {
                    slotEl.classList.add('selected', 'text-white');
                    slotEl.classList.remove('text-gray-700');
                }

                slotsContainer.appendChild(slotEl);
                slotsFound = true;

                currentTime.setMinutes(currentTime.getMinutes() + 30);
            }
            
            if (!slotsFound) {
                 slotsContainer.innerHTML = '<p class="text-gray-500 text-center py-10">Aucun créneau disponible pour cette date.</p>';
            }
        }
        
        /**
         * Sélectionne un créneau horaire spécifique.
         */
        function selectTimeSlot(time, element) {
            // Désélectionner tous les autres créneaux
            document.querySelectorAll('.slot-button').forEach(btn => {
                btn.classList.remove('selected', 'text-white');
                btn.classList.add('text-gray-700');
            });

            // Sélectionner le nouveau créneau
            selectedTimeSlot = time;
            element.classList.add('selected', 'text-white');
            element.classList.remove('text-gray-700');

            updateReservationSummary();
        }


        /**
         * Génère et affiche le calendrier.
         */
        function renderCalendar() {
            calendarContainer.innerHTML = '';
            
            const month = currentMonthDate.getMonth();
            const year = currentMonthDate.getFullYear();
            
            monthYearDisplay.textContent = `${MONTH_NAMES[month]} ${year}`;
            
            const firstDayOfMonth = new Date(year, month, 1);
            let startingDay = (firstDayOfMonth.getDay() + 6) % 7; 
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (let i = 0; i < startingDay; i++) {
                calendarContainer.innerHTML += '<div></div>';
            }

            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                const dayOfWeek = (date.getDay() + 6) % 7; 

                const dayEl = document.createElement('div');
                dayEl.textContent = day;
                dayEl.classList.add('day-cell');
                
                const isToday = date.getTime() === today.getTime();
                const isSelected = selectedDate && date.getTime() === selectedDate.getTime();
                const isClosed = OPENING_HOURS[dayOfWeek] === 'Fermé';
                const isPast = date < today;

                if (isClosed || isPast) {
                    dayEl.classList.add('closed');
                } else {
                    dayEl.classList.add('valid');
                    dayEl.onclick = () => selectDay(year, month, day);
                }
                
                if (isToday) {
                    dayEl.classList.add('today');
                }
                if (isSelected) {
                    dayEl.classList.add('selected');
                }

                calendarContainer.appendChild(dayEl);
            }
            
            if (selectedDate && selectedDate.getMonth() === month && selectedDate.getFullYear() === year) {
                renderTimeSlots(selectedDate);
            } else {
                slotsContainer.innerHTML = '<p class="text-gray-500 text-center py-10">Sélectionnez une date.</p>';
            }
        }
        
        /**
         * Change le mois affiché dans le calendrier.
         */
        function changeMonth(step) {
            const newMonth = currentMonthDate.getMonth() + step;
            currentMonthDate.setMonth(newMonth);
            renderCalendar();
        }
        
        // === LOGIQUE DE CONFIRMATION ET UX (Loader / Toast) ===

        /**
         * Affiche la notification Toast avec un message donné.
         */
        function showToast(message) {
            const toast = document.getElementById('toast');
            document.getElementById('toast-message').textContent = message;
            
            toast.classList.add('show');
            
            // Masquer le toast après 4 secondes
            setTimeout(() => {
                toast.classList.remove('show');
            }, 4000);
        }

        /**
         * Simule l'envoi de la réservation et gère l'UX du loader et du toast.
         */
        function confirmReservation() {
            if (!selectedService.name || !selectedDate || !selectedTimeSlot) {
                // Cette condition ne devrait pas être atteinte si le bouton est désactivé
                showToast("Veuillez sélectionner une prestation, une date et une heure.", true);
                return;
            }

            // 1. Afficher le loader
            loader.classList.remove('hidden');
            confirmButton.disabled = true; // Empêche les clics répétés
            
            // 2. Simuler l'appel API (2 secondes)
            setTimeout(() => {
                // 3. Masquer le loader
                loader.classList.add('hidden');

                // 4. Afficher le message de succès (Toast)
                showToast("Votre rendez-vous a été réservé avec succès !");

                // 5. Réinitialiser l'état (ou rediriger l'utilisateur)
                // Ici, on réinitialise juste l'heure sélectionnée
                selectedTimeSlot = null;
                confirmButton.disabled = true;
                renderTimeSlots(selectedDate); // Rafraîchir les slots pour montrer que le créneau est pris (simulé)
                updateReservationSummary();

            }, 2000); // 2000 ms = 2 secondes de chargement simulé
        }


        // === LOGIQUE LIGHTBOX (Carrousel) - Maintenue ===
        
        function updateLightbox() {
            const img = images[currentImageIndex];
            modalImage.src = img.src;
            modalImage.alt = img.alt;
            modalCaption.textContent = img.alt; 
        }

        function openLightbox(index) {
            currentImageIndex = index;
            updateLightbox();
            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.add('opacity-100');
                modalContent.classList.remove('opacity-0', 'scale-95');
                modalContent.classList.add('opacity-100', 'scale-100');
            }, 10);
        }

        function animateAndHideModal() {
            modal.classList.remove('opacity-100');
            modalContent.classList.remove('opacity-100', 'scale-100');
            modalContent.classList.add('opacity-0', 'scale-95');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 400); 
        }

        function forceCloseLightbox() {
            animateAndHideModal();
        }

        function closeLightbox(event) {
            if (event.target === modal) {
                animateAndHideModal();
            }
        }

        function changeImage(step) {
            const direction = step > 0 ? -10 : 10;
            
            modalImage.style.opacity = '0';
            modalImage.style.transform = `translateX(${direction}px)`;

            setTimeout(() => {
                currentImageIndex += step;
                if (currentImageIndex < 0) {
                    currentImageIndex = images.length - 1;
                } else if (currentImageIndex >= images.length) {
                    currentImageIndex = 0;
                }
                
                updateLightbox();
                modalImage.style.transform = `translateX(${-direction}px)`; 
                void modalImage.offsetWidth; 
                modalImage.style.opacity = '1';
                modalImage.style.transform = 'translateX(0)';
            }, 150); 
        }
        
        // === INITIALISATION ===
        
        window.onload = function() {
            renderCalendar();
            // Initialiser l'état du bouton de confirmation
            updateReservationSummary(); 
            
            // Sélectionner une prestation par défaut pour pouvoir tester la réservation tout de suite (UX)
            selectService('Soin profond avec Kouss qui masse', '51 €');
            document.querySelector('.service-card[data-service-id="1"] button').textContent = 'Sélectionné';
            document.querySelector('.service-card[data-service-id="1"] button').classList.add('bg-violet-600', 'text-white');
        };
