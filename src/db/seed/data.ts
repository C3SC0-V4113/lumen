export const team = [
  ['mar-ortega', 'Mar Ortega', 'Art director', 'Dirección de arte', 'art'],
  ['teo-lindqvist', 'Teo Lindqvist', 'Gameplay programmer', 'Programación de jugabilidad', 'code'],
  ['kai-moreno', 'Kai Moreno', 'Narrative designer', 'Diseño narrativo', 'design'],
  ['ines-achebe', 'Ines Achebe', 'Composer', 'Composición', 'sound'],
  ['ruth-park', 'Ruth Park', 'Producer', 'Producción', 'production'],
  ['bo-silva', 'Bo Silva', 'Environment artist', 'Artista de entornos', 'art'],
  ['priya-nair', 'Priya Nair', 'Engine programmer', 'Programación del motor', 'code'],
  ['elif-demir', 'Elif Demir', 'Level designer', 'Diseño de niveles', 'design'],
  ['noa-ferreira', 'Noa Ferreira', 'Character artist', 'Artista de personajes', 'art'],
  ['lena-vogel', 'Lena Vogel', 'Graphics programmer', 'Programación gráfica', 'code'],
  ['tomas-vidal', 'Tomás Vidal', 'Sound designer', 'Diseño de sonido', 'sound'],
  ['sofi-campos', 'Sofi Campos', 'QA lead', 'Liderazgo de QA', 'production'],
  ['lucia-rivas', 'Lucía Rivas', 'Concept artist', 'Artista conceptual', 'art'],
  ['jonas-berg', 'Jonas Berg', 'Systems designer', 'Diseño de sistemas', 'design'],
  ['diego-marin', 'Diego Marín', 'Tools programmer', 'Programación de herramientas', 'code'],
  ['yuki-mori', 'Yuki Mori', 'Community manager', 'Gestión de comunidad', 'production'],
  ['aiko-tanaka', 'Aiko Tanaka', 'Technical artist', 'Artista técnico', 'art'],
  ['ana-lima', 'Ana Lima', 'UX designer', 'Diseño UX', 'design'],
  ['omar-haddad', 'Omar Haddad', 'Platform programmer', 'Programación de plataformas', 'code'],
  ['pau-serra', 'Pau Serra', 'Foley artist', 'Artista de Foley', 'sound'],
  ['sam-okafor', 'Sam Okafor', 'UI artist', 'Artista de interfaz', 'art'],
  ['malik-grant', 'Malik Grant', 'Associate producer', 'Productor asociado', 'production'],
  ['rafa-duarte', 'Rafa Duarte', 'Localization lead', 'Liderazgo de localización', 'production'],
] as const;

export const rich = (text: string) => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
});

export const kaiBioEnV3 = rich(
  'Kai writes the stories of the island towns. Before Lumen, Kai wrote quests for tabletop campaigns in San Salvador and ran a small zine about horror games.'
);
export const kaiBioEnV4 = {
  type: 'doc',
  content: [
    ...kaiBioEnV3.content,
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Kai also reviews every line of the Spanish translation, because the towns should sound the same in both languages.',
        },
      ],
    },
  ],
};
export const kaiBioEs = rich(
  'Kai escribe las historias de los pueblos de las islas. Antes de Lumen, Kai escribía misiones para partidas de rol en San Salvador y llevaba un pequeño fanzine sobre juegos de terror.'
);
