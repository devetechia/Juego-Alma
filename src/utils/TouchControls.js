/**
 * Controles táctiles por gestos, sin botones en pantalla.
 *
 * Esquema (pensado para una niña de 6 años con la tablet en horizontal):
 *   - Mantener pulsada la MITAD DERECHA   -> avanza (hacia la derecha)
 *   - Mantener pulsada la MITAD IZQUIERDA -> retrocede (hacia la izquierda)
 *   - Deslizar el dedo hacia ARRIBA       -> salta
 *   - Un segundo dedo, en cualquier sitio -> salta (pulgar de apoyo)
 *
 * El primer dedo que toca la pantalla se queda con el movimiento; el segundo solo salta,
 * así que apoyar el pulgar no cambia la dirección.
 *
 * `jumpPressed` es un aviso de un solo uso: lo consume Player.update() cuando lo lee.
 * No se apaga con temporizadores, para que no se pierda ningún salto si el navegador
 * va justo de rendimiento.
 */
export class TouchControls {
    constructor(scene) {
        this.scene = scene;
        this.left = false;
        this.right = false;
        this.jumpPressed = false;
        this.jumpHeld = false;
        this.crouch = false;

        this.principal = null;          // dedo que manda en el movimiento
        this.secundarios = 0;           // dedos de apoyo (saltan)
        this.startY = 0;
        this.yaDeslizo = false;

        this.setupGestureEvents();
    }

    setupGestureEvents() {
        const canvas = this.scene.sys.game.canvas;
        this.canvas = canvas;

        this.handlers = {
            touchstart: (e) => this.handleTouchStart(e),
            touchmove: (e) => this.handleTouchMove(e),
            touchend: (e) => this.handleTouchEnd(e),
            touchcancel: (e) => this.handleTouchEnd(e),
            mousedown: (e) => this.handleMouseDown(e),
            mouseup: (e) => this.handleMouseUp(e),
            mouseleave: (e) => this.handleMouseUp(e),
        };

        canvas.addEventListener('touchstart', this.handlers.touchstart, { passive: false });
        canvas.addEventListener('touchmove', this.handlers.touchmove, { passive: false });
        canvas.addEventListener('touchend', this.handlers.touchend, { passive: false });
        canvas.addEventListener('touchcancel', this.handlers.touchcancel, { passive: false });

        canvas.addEventListener('mousedown', this.handlers.mousedown);
        canvas.addEventListener('mouseup', this.handlers.mouseup);
        canvas.addEventListener('mouseleave', this.handlers.mouseleave);
    }

    /** Mitad de la pantalla en la que ha caído el dedo. */
    lado(clientX) {
        const rect = this.canvas.getBoundingClientRect();
        return (clientX - rect.left) < rect.width / 2 ? 'izquierda' : 'derecha';
    }

    handleTouchStart(e) {
        e.preventDefault();
        for (const touch of e.changedTouches) {
            if (this.principal === null) {
                this.principal = touch.identifier;
                this.startY = touch.clientY;
                this.yaDeslizo = false;
                const lado = this.lado(touch.clientX);
                this.right = lado === 'derecha';
                this.left = !this.right;
            } else {
                this.secundarios++;
                this.pedirSalto();
            }
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        for (const touch of e.changedTouches) {
            if (touch.identifier === this.principal && !this.yaDeslizo) {
                if ((this.startY - touch.clientY) > 40) {
                    this.yaDeslizo = true;
                    this.pedirSalto();
                }
            }
        }
    }

    handleTouchEnd(e) {
        e.preventDefault();
        for (const touch of e.changedTouches) {
            if (touch.identifier === this.principal) {
                this.principal = null;
                this.left = false;
                this.right = false;
                this.yaDeslizo = false;
            } else if (this.secundarios > 0) {
                this.secundarios--;
            }
        }
        if (this.principal === null && this.secundarios === 0) this.jumpHeld = false;
        if (this.secundarios === 0) this.jumpHeld = this.principal !== null ? this.jumpHeld : false;
    }

    pedirSalto() {
        this.jumpPressed = true;        // lo consume Player.update()
        this.jumpHeld = true;
    }

    // --- ratón: solo para probar en el ordenador, con la barra espaciadora para saltar ---
    handleMouseDown(e) {
        const derecha = this.lado(e.clientX) === 'derecha';
        this.right = derecha;
        this.left = !derecha;
    }

    handleMouseUp() {
        this.left = false;
        this.right = false;
        this.jumpHeld = false;
    }

    updateVisibility() { /* sin botones que mostrar */ }

    destroy() {
        if (!this.canvas || !this.handlers) return;
        this.canvas.removeEventListener('touchstart', this.handlers.touchstart);
        this.canvas.removeEventListener('touchmove', this.handlers.touchmove);
        this.canvas.removeEventListener('touchend', this.handlers.touchend);
        this.canvas.removeEventListener('touchcancel', this.handlers.touchcancel);
        this.canvas.removeEventListener('mousedown', this.handlers.mousedown);
        this.canvas.removeEventListener('mouseup', this.handlers.mouseup);
        this.canvas.removeEventListener('mouseleave', this.handlers.mouseleave);
        this.handlers = null;
        this.canvas = null;
    }
}
