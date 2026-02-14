Correctif v3 — Support du schéma 'triple-clé' (compétence || critère || exigence)

Ce patch permet :
1) Lecture du JSON **triple-clé** : 
   {
     "C 2.02 : Choisir ... || Identifier ... || aze": true
   }
2) Compat descendante du schéma **legacy** :
   { "COMP II ITEM": ["exig1","exig2"] }

Où mettre le fichier :
- public/data/exigences_db.json

Exemple de ligne triple-clé (celle que tu as demandée) :
"C 2.02 : Choisir les matériels et les outillages || Identifier et vérifier la compatibilité du matériel et de l’outillage nécessaires à la réalisation de son intervention : || aze": true
