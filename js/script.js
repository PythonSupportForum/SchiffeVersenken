class GameField {
    constructor (status = 0){
        this.fields = [];
        let field_info = document.createElement("h2");
        field_info.innerText = "Wird geladen..";
        this.textElement = field_info;
        this.setStatus(status);
        let water_container = document.createElement("div");
        water_container.classList.add("water_container");
        let water = document.createElement("div");
        water.classList.add("water");
        water_container.appendChild(water);
        function create_field(x, y){
            let f = document.createElement("div");
            f.classList.add("field");
            return f;
        }
        for(let y = 0; y < 10; y++){
            let row = document.createElement("div");
            row.classList.add("row");
            let row_fields = [];
            for(let x = 0; x < 10; x++){
                let element = create_field(x, y);
                row.appendChild(element);
                let field_data = {status: false, element: element, x: x, y: y};
                row_fields.push(field_data);
                element.onclick = function(){
                    if(this.field.status === 0) {
                        if(!this.data.status) {
                            function field_status(fields, x, y){
                                if(x < 0 || x > 9 || y < 0 || y > 9) return false;
                                return fields[y][x].status;
                            };
                            if(field_status(this.field.fields, this.data.x-1, this.data.y-1) || field_status(this.field.fields, this.data.x+1, this.data.y+1) || field_status(this.field.fields, this.data.x-1, this.data.y+1) || field_status(this.field.fields, this.data.x+1, this.data.y-1)) return;
                        }
                        this.data.status = !this.data.status;
                        if (this.data.status) {
                            this.data.element.classList.add("ship");
                        } else {
                            this.data.element.classList.remove("ship");
                        }
                    }
                }.bind({field: this, data: field_data});
            }
            water.appendChild(row);
            this.fields.push(row_fields);
        }
        let field = document.createElement("div");
        field.classList.add("gameElement");
        field.appendChild(field_info);
        field.appendChild(water_container);
        document.getElementById("game_container").appendChild(field);
    }
    setText(text, color = false){
        if(!this.textElement) return;
        this.textElement.innerText = text;
        if(color) this.textElement.style.color = color;
    }
    setStatus(status){
        this.status = status;
        switch(this.status) {
            case 0:
                this.setText("Verstecke deine Schiffe");
                break;
            case 1:
                this.setText("Deine Schiffe:");
                break;
            case 2:
                this.setText("Gegnerische Flotte:");
                break;
        }
    }
}
window.onload = function(){
    window.me = new GameField(0);
    window.gegener = new GameField(2);
}