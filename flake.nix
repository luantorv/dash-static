{
  description = "Entorno de Desarrollo para Dash-Static";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";
    utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, utils }:
    utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_20
            #sqlite
          ];

          shellHook = ''
            echo "--- Entorno de AdminJS cargado ---"
            echo "Node version: $(node --version)"
            echo "NPM version:  $(npm --version)"
            
            # Opcional: Instala dependencias automáticamente si falta node_modules
            if [ ! -d "node_modules" ]; then
              echo "Instalando dependencias de npm..."
              npm install
            fi
          '';
        };
      });
}
