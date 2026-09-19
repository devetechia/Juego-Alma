#!/usr/bin/env python3
"""
Extrae las 9 poses de Alma de sprites.png y compone una hoja de sprites limpia
para Phaser: rejilla 3x3 de celdas 170x210, cada figura entera dentro de su celda.

Motivo: la extraccion anterior alineaba las figuras pegadas al borde inferior de la
celda, de forma que algunas cruzaban la linea de su celda y las de la fila de abajo
quedaban cortadas por el borde de la hoja. Resultado: Alma se veia cortada por las
piernas en el juego.

Este script:
  1. quita el fondo de cuadros por relleno desde los bordes (respeta los blancos interiores)
  2. detecta las 9 figuras por componentes conectados
  3. las ordena igual que antes (arriba-abajo, izquierda-derecha) para no cambiar los indices
  4. las escala a un maximo de 150x186 y las pega centradas y con margen dentro de su celda
  5. VERIFICA que el contenido de cada celda queda dentro de la celda, y falla si no

Salida: public/assets/sprites/alma-poses.png y arte/_control/poses-verificacion.png
"""

import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUT = os.path.join(ROOT, 'sprites.png')
OUT = os.path.join(ROOT, 'public/assets/sprites/alma-poses.png')
CHECK = os.path.join(ROOT, 'arte/_control/poses-verificacion.png')

CELL_W, CELL_H = 170, 210
COLS, ROWS = 3, 3
FIG_MAX_W, FIG_MAX_H = 150, 186      # deja 10 px de margen a los lados y 14 abajo
BASELINE = 196                       # y donde apoyan los pies dentro de la celda
MIN_AREA = 1500


def is_bg(r, g, b):
    mx, mn = max(r, g, b), min(r, g, b)
    return (mx - mn) <= 14 and mn >= 185


def main():
    img = Image.open(INPUT).convert('RGB')
    W, H = img.size
    px = img.load()
    print(f'Origen {W}x{H}')

    bg = bytearray(W * H)
    stack = []

    def push(x, y):
        p = y * W + x
        if bg[p]:
            return
        r, g, b = px[x, y]
        if not is_bg(r, g, b):
            return
        bg[p] = 1
        stack.append(p)

    for x in range(W):
        push(x, 0); push(x, H - 1)
    for y in range(H):
        push(0, y); push(W - 1, y)
    while stack:
        p = stack.pop()
        x, y = p % W, p // W
        if x > 0: push(x - 1, y)
        if x < W - 1: push(x + 1, y)
        if y > 0: push(x, y - 1)
        if y < H - 1: push(x, y + 1)

    print(f'Fondo exterior detectado: {sum(bg) / (W * H) * 100:.1f} %')

    # --- segunda pasada: manchas de cuadros ENCERRADAS dentro de una figura ---
    # (por ejemplo el hueco entre el brazo y la capa). Se distinguen de los ojos y los
    # dientes porque la cuadricula trae cuadrados grises, no solo blanco.
    visitado = bytearray(W * H)
    parches = 0
    for sy in range(H):
        for sx in range(W):
            p0 = sy * W + sx
            if bg[p0] or visitado[p0]:
                continue
            r, g, b = px[sx, sy]
            if not is_bg(r, g, b):
                visitado[p0] = 1
                continue
            reg = [p0]
            visitado[p0] = 1
            i = 0
            grises = 0
            while i < len(reg):
                q = reg[i]; i += 1
                x, y = q % W, q // W
                lum = sum(px[x, y]) / 3
                if lum < 245:
                    grises += 1
                for n, ok in ((q - 1, x > 0), (q + 1, x < W - 1), (q - W, y > 0), (q + W, y < H - 1)):
                    if ok and not bg[n] and not visitado[n]:
                        nr, ng, nb = px[n % W, n // W]
                        if is_bg(nr, ng, nb):
                            visitado[n] = 1
                            reg.append(n)
            if len(reg) >= 20 and grises / len(reg) >= 0.15:
                for q in reg:
                    bg[q] = 1
                parches += 1
    print(f'Manchas de cuadricula encerradas eliminadas: {parches}')

    label = [-1] * (W * H)
    comps = []
    for sy in range(H):
        for sx in range(W):
            p0 = sy * W + sx
            if bg[p0] or label[p0] != -1:
                continue
            cid = len(comps)
            minx = maxx = sx
            miny = maxy = sy
            area = 0
            label[p0] = cid
            q = [p0]
            while q:
                p = q.pop()
                x, y = p % W, p // W
                area += 1
                minx = min(minx, x); maxx = max(maxx, x)
                miny = min(miny, y); maxy = max(maxy, y)
                for n in (p - 1 if x > 0 else -1, p + 1 if x < W - 1 else -1,
                          p - W if y > 0 else -1, p + W if y < H - 1 else -1):
                    if n >= 0 and not bg[n] and label[n] == -1:
                        label[n] = cid
                        q.append(n)
            comps.append(dict(id=cid, minx=minx, maxx=maxx, miny=miny, maxy=maxy, area=area))

    # orden estable igual que la version anterior: por bandas de y (60 px) y luego por x
    figs = sorted([c for c in comps if c['area'] > MIN_AREA], key=lambda c: c['minx'])
    ordered = []
    for c in sorted(figs, key=lambda c: c['miny']):
        placed = False
        for band in ordered:
            if abs(band['y'] - c['miny']) <= 60:
                band['items'].append(c)
                placed = True
                break
        if not placed:
            ordered.append({'y': c['miny'], 'items': [c]})
    flat = []
    for band in ordered:
        flat.extend(sorted(band['items'], key=lambda c: c['minx']))

    print(f'Figuras: {len(flat)}')
    for i, f in enumerate(flat):
        print(f'  #{i}: x[{f["minx"]}-{f["maxx"]}] y[{f["miny"]}-{f["maxy"]}] '
              f'{f["maxx"] - f["minx"] + 1}x{f["maxy"] - f["miny"] + 1} area {f["area"]}')

    sheet = Image.new('RGBA', (COLS * CELL_W, ROWS * CELL_H), (0, 0, 0, 0))
    boxes = []
    for i, f in enumerate(flat):
        pad = 4
        left = max(0, f['minx'] - pad); right = min(W - 1, f['maxx'] + pad)
        top = max(0, f['miny'] - pad); bottom = min(H - 1, f['maxy'] + pad)
        cw, ch = right - left + 1, bottom - top + 1
        fig = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
        fp = fig.load()
        for y in range(ch):
            row = (top + y) * W
            for x in range(cw):
                p = row + left + x
                if not bg[p]:
                    r, g, b = px[left + x, top + y]
                    fp[x, y] = (r, g, b, 255)

        scale = min(FIG_MAX_W / cw, FIG_MAX_H / ch, 1.0)
        tw, th = max(1, round(cw * scale)), max(1, round(ch * scale))
        fig = fig.resize((tw, th), Image.LANCZOS)

        col, row = i % COLS, i // COLS
        ox = col * CELL_W + (CELL_W - tw) // 2
        oy = row * CELL_H + (BASELINE - th)
        sheet.alpha_composite(fig, (ox, oy))
        boxes.append((i, ox, oy, tw, th))

    # --- verificacion: ningun contenido puede tocar el borde de su celda ---
    sp = sheet.load()
    problemas = []
    for i, ox, oy, tw, th in boxes:
        col, row = i % COLS, i // COLS
        cl, ct = col * CELL_W, row * CELL_H
        cr, cb = cl + CELL_W - 1, ct + CELL_H - 1
        minx = miny = 10 ** 9; maxx = maxy = -1
        for y in range(ct, cb + 1):
            for x in range(cl, cr + 1):
                r, g, b, a = sp[x, y]
                if a > 20 and (r or g or b):
                    minx = min(minx, x); maxx = max(maxx, x)
                    miny = min(miny, y); maxy = max(maxy, y)
        if maxx < 0:
            problemas.append(f'celda {i}: vacia')
            continue
        margen = min(minx - cl, cr - maxx, miny - ct, cb - maxy)
        print(f'  celda {i}: contenido x[{minx}-{maxx}] y[{miny}-{maxy}] margen minimo {margen} px')
        if margen < 2:
            problemas.append(f'celda {i}: contenido a {margen} px del borde')

    sheet.save(OUT)
    print('Hoja:', OUT, sheet.size, os.path.getsize(OUT), 'bytes')

    # render de comprobacion con la rejilla marcada
    chk = Image.new('RGBA', sheet.size, (255, 0, 255, 255))
    chk.alpha_composite(sheet)
    d = ImageDraw.Draw(chk)
    for x in range(0, sheet.width + 1, CELL_W):
        d.line([(x, 0), (x, sheet.height)], fill=(0, 255, 0, 255), width=1)
    for y in range(0, sheet.height + 1, CELL_H):
        d.line([(0, y), (sheet.width, y)], fill=(0, 255, 0, 255), width=1)
    chk.resize((sheet.width * 2, sheet.height * 2), Image.NEAREST).convert('RGB').save(CHECK)
    print('Comprobacion:', CHECK)

    if problemas:
        print('PROBLEMAS:')
        for p in problemas:
            print('  -', p)
        raise SystemExit(1)
    print('VERIFICADO: las 9 figuras caben enteras dentro de sus celdas.')


if __name__ == '__main__':
    main()
