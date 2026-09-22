"""Enrich the site dataset from an OSM API XML snapshot. Usage: python3 scripts/enrich-kangla-osm.py snapshot.xml"""
import json, sys, xml.etree.ElementTree as ET
from pathlib import Path
p=Path(__file__).resolve().parents[1] / 'public/models/kangla/kangla-site.geojson'
d=json.loads(p.read_text()); d['features']=[f for f in d['features'] if f['properties']['kind'] not in ('path','river')]; root=ET.parse(sys.argv[1]).getroot()
nodes={n.attrib['id']:[float(n.attrib['lon']),float(n.attrib['lat'])] for n in root.findall('node')}
for w in root.findall('way'):
 t={e.attrib['k']:e.attrib['v'] for e in w.findall('tag')}
 if not (t.get('highway') or t.get('waterway')=='river'):continue
 pts=[nodes[n.attrib['ref']] for n in w.findall('nd') if n.attrib['ref'] in nodes]
 if len(pts)<2 or not any(93.938<x<93.947 and 24.802<y<24.814 for x,y in pts):continue
 d['features'].append({'type':'Feature','properties':{'kind':'river' if t.get('waterway')=='river' else 'path','osm':'way/'+w.attrib['id'],'highway':t.get('highway',''),'name':t.get('name','')},'geometry':{'type':'LineString','coordinates':pts}})
d['source']={'name':'OpenStreetMap contributors','license':'ODbL 1.0','downloaded':'2026-09-22','url':'https://www.openstreetmap.org/copyright','heightNote':'Building elevations are illustrative; no measured heights in this dataset.'}
p.write_text(json.dumps(d,separators=(',',':'))+'\n')
print('Features:',len(d['features']))
