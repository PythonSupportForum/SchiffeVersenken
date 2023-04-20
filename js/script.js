class GameField {
    constructor (status = 0, h = 10, w = 10, ships = {
        2: {
            name: "Ruderboot",
            count: 4
        },
        3: {
            name: "Motorschiff",
            count: 3
        },
        4: {
            name: "Frachtschiff",
            count: 2
        },
        5: {
            name: "Kreuzer",
            count: 1
        }
    }){
        this.ship_types = ships;
        this.fields = [];
        this.max_ship_length = 0;
        Object.values(this.ship_types).forEach(function(d){
            if(d.count > this.max_ship_length) this.max_ship_length = d.count;
        }.bind(this));
        this.h = h;
        this.w = w;
        let field_info = document.createElement("h2");
        field_info.innerText = "Wird geladen..";
        this.textElement = field_info;
        this.setStatus(status);
        let water_container = document.createElement("div");
        water_container.classList.add("water_container");
        let water = document.createElement("div");
        water.classList.add("water");
        water_container.appendChild(water);
        let info_container = document.createElement("div");
        info_container.classList.add("footer_info");
        this.info_container = info_container;

        function create_field(x, y){
            let f = document.createElement("div");
            let img = document.createElement("img");
            img.alt = "Schiff Icon";
            img.style.display = "none";
            f.appendChild(img);
            f.classList.add("field");
            return f;
        }
        for(let y = 0; y < this.h; y++){
            let row = document.createElement("div");
            row.classList.add("row");
            let row_fields = [];
            for(let x = 0; x < this.w; x++){
                let element = create_field(x, y);
                element.style.height = (350/this.h)+"px";
                element.style.width = (350/this.w)+"px";
                row.appendChild(element);
                let field_data = {status: false, element: element, x: x, y: y, texture: false};
                row_fields.push(field_data);
                element.onclick = function(){
                    if(this.field.status === 0) {
                        if(!this.data.status) {
                            if(this.field.field_status(this.field.fields, this.data.x-1, this.data.y-1) || this.field.field_status(this.field.fields, this.data.x+1, this.data.y+1) || this.field.field_status(this.field.fields, this.data.x-1, this.data.y+1) || this.field.field_status(this.field.fields, this.data.x+1, this.data.y-1)) return;
                            let test = JSON.parse(JSON.stringify(this.field.fields));
                            test[this.data.y][this.data.x] = {status: true};
                            let length = this.field.ship_length(test, this.data.x, this.data.y);
                            if(length > this.field.max_ship_length+1) return;
                        }
                        this.data.status = !this.data.status;
                        if (this.data.status) {
                            this.data.element.classList.add("ship");
                        } else {
                            this.data.element.classList.remove("ship");
                        }
                        this.field.update();
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
        field.appendChild(info_container);
        document.getElementById("game_container").appendChild(field);

        this.update();
    }
    field_status(fields, x, y){
        if(x < 0 || x > 9 || y < 0 || y > 9) return false;
        return fields[y][x].status;
    }
    ship_length(fields, x, y){
        let length = -1;
        while(this.field_status(fields, x, y)) {
            x++;
        }
        x--;
        while(this.field_status(fields, x,y)) {
            y++;
        }
        y--;
        while(this.field_status(fields, x,y)) {
            length++;
            x--;
        }
        x++;
        while(this.field_status(fields, x,y)) {
            length++;
            y--;
        }
        return length;
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
        this.update();
    }
    scan_ships(){
        let ships = {};
        for(let y = 0; y < this.h; y++) {
            for (let x = 0; x < this.w; x++) {
                if(this.field_status(this.fields, x, y)){
                    let length = this.ship_length(this.fields,x, y);
                    ships[length] = ((length in ships) ? ships[length] : 0)+1;
                }
            }
        }
        Object.keys(this.ship_types).forEach(function(length){
            ships[length] = length in ships ? ships[length]/Number(length) : 0;
        });
        return ships;
    }
    update(){
        setTimeout(function(){
            this.info_container.style.display = this.status === 0 ? "block" : "none";
            if(this.status === 0) {
                let html = "<ul>";
                let ship_counts = this.scan_ships();
                Object.keys(this.ship_types).forEach(function(length){
                    html += '<li class="'+(ship_counts[length] !== this.ship_types[length].count ? "needed_ship" : "")+'">'+this.ship_types[length].name+' ('+length+' Kästchen): '+ship_counts[length]+'/'+this.ship_types[length].count+'</li>';
                }.bind(this));
                html += "</ul>";
                let error = false;
                let invalid_count = false;
                let invalid_types = [];
                Object.keys(ship_counts).forEach(function(length){
                    if(!(length in this.ship_types)) {
                        invalid_types.push(length);
                        return error = true;
                    }
                    if(ship_counts[length] !== this.ship_types[length].count) {
                        error = true;
                        invalid_count = true;
                    }
                }.bind(this));
                Object.keys(this.ship_types).forEach(function(length){
                    if(ship_counts[length] !== this.ship_types[length].count) {
                        error = true;
                        invalid_count = true;
                    }
                }.bind(this));
                if(!error) {
                    html += '<button onclick="start_game();">🏁 Spiel Starten 🏁</button>';
                } else {
                    if(invalid_types.length > 0 && !invalid_count){
                        html += '<div style="color: red; text-align: left; ">Folgende Schiffe werden in diesem Spiel Modi nicht unterstützt: <br><ul>';
                        invalid_types.forEach(function(length){
                            html += '<li>'+length+'er Boote</li>';
                        });
                        html += '</ul></div>';
                    }
                }
                this.info_container.innerHTML = html;
            }
            for(let y = 0; y < this.h; y++) {
                for (let x = 0; x < this.w; x++) {
                    if (this.field_status(this.fields, x, y)) {
                        let teil = "one";
                        let rotation = false;
                        if(this.field_status(this.fields, x, y+1) && this.field_status(this.fields, x, y-1)){
                            rotation = true;
                            teil = "middle";
                        }
                        if(this.field_status(this.fields, x+1, y) && this.field_status(this.fields, x-1, y)){
                            rotation = false;
                            teil = "middle";
                        }
                        if(this.field_status(this.fields, x+1, y) && !this.field_status(this.fields, x-1, y)){
                            rotation = false;
                            teil = "back";
                        }
                        if(this.field_status(this.fields, x-1, y) && !this.field_status(this.fields, x+1, y)){
                            rotation = false;
                            teil = "front";
                        }
                        if(this.field_status(this.fields, x, y+1) && !this.field_status(this.fields, x, y-1)){
                            rotation = true;
                            teil = "back";
                        }
                        if(this.field_status(this.fields, x, y-1) && !this.field_status(this.fields, x, y+1)){
                            rotation = true;
                            teil = "front";
                        }
                        this.fields[y][x].element.children[0].style.display = "block";
                        this.fields[y][x].element.children[0].src = "images/gameAssets/"+teil+(this.fields[y][x].status === true ? "" : "_dest")+".png";
                        this.fields[y][x].element.children[0].style.transform = "rotate("+(rotation ? 90 : 0)+"deg)";
                    } else {
                        this.fields[y][x].element.children[0].style.display = "none";
                    }
                }
            }
        }.bind(this), 20);
    }
}
window.onload = function(){
    window.my_field = new GameField(0);
}