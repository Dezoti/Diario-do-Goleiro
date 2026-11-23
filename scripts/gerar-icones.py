"""Gera os ícones do app (icons/) a partir de assets/logos/diario-do-goleiro.png, sobre o fundo escuro do app.
Uso: python3 scripts/gerar-icones.py   (precisa do Pillow)"""
import os
from PIL import Image

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
FUNDO = (15, 17, 21, 255)

src = Image.open(os.path.join(RAIZ, 'assets', 'logos', 'diario-do-goleiro.png')).convert('RGBA')
caixa = src.getchannel('A').point(lambda a: 255 if a > 16 else 0).getbbox()
logo = src.crop(caixa)  # tira a margem transparente

def icone(tamanho, escala):
    im = Image.new('RGBA', (tamanho, tamanho), FUNDO)
    k = escala * tamanho / max(logo.size)
    l = logo.resize((round(logo.width * k), round(logo.height * k)), Image.LANCZOS)
    im.alpha_composite(l, ((tamanho - l.width) // 2, (tamanho - l.height) // 2))
    return im.convert('RGB')

# Quadrados cheios: o sistema arredonda. O "maskable" deixa folga para o recorte do Android.
icone(192, 0.82).save(os.path.join(RAIZ, 'icons', 'icon-192.png'))
icone(512, 0.82).save(os.path.join(RAIZ, 'icons', 'icon-512.png'))
icone(512, 0.62).save(os.path.join(RAIZ, 'icons', 'icon-maskable-512.png'))
print('ícones atualizados')
