export type ParsedClass = {
  name: string;
  methods: string[];
};

export type ParsedFile = {
  path: string;
  imports: string[];
  functions: string[];
  classes: ParsedClass[];
  interfaces: string[];
  types: string[];
  exports: string[];
};