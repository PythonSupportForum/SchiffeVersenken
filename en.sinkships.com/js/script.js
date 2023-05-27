class GameField {
    constructor (status = 0, h = 10, w = 10, ships = {
        2: {
            name: "Ruderboot",
            count: 3
        },
        3: {
            name: "Motorschiff",
            count: 2
        },
        4: {
            name: "Kreuzer",
            count: 2
        }
    }, gv = 0, random_ships_as_default = true){
        this.gv = gv;
        this.ship_types = ships;
        this.fields = [];
        this.max_ship_length = 0;
        Object.keys(this.ship_types).forEach(function(l){
            if(l > this.max_ship_length) this.max_ship_length = Number(l);
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

        function create_field(){
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
                let element = create_field();
                element.style.height = (350/this.h)+"px";
                element.style.width = (350/this.w)+"px";
                row.appendChild(element);
                let field_data = {status: false, element: element, x: x, y: y, texture: false, beaten: false};
                row_fields.push(field_data);
                element.onclick = function(){
                    if(this.field.status === 0) {
                        if(!this.data.status) {
                            if(!this.field.checkField(x, y)) return;
                        }
                        this.field.setField(x, y, !this.data.status);
                    } else if(this.field.status === 4) {
                        if(!this.data.status) {
                            this.field.setText("Wird verarbeitet...");
                            Server.hit(this.data.x, this.data.y);
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
        field.appendChild(info_container);
        document.getElementById("game_container").appendChild(field);

        this.full_container = field;

        this.update().then(() => {});

        if(random_ships_as_default) this.placeShipsRandomly().then(() => {});
    }
    checkField(x, y){
        if(this.field_status(this.fields, x, y)) return false;

        if(this.field_status(this.fields, x-1, y-1) || this.field_status(this.fields, x+1, y+1) || this.field_status(this.fields, x-1, y+1) || this.field_status(this.fields, x+1, y-1)) return false;
        let test = JSON.parse(JSON.stringify(this.fields));
        test[y][x] = {status: true};
        let length = this.ship_length(test, x, y)-1;
        return length <= this.max_ship_length;
    }
    setField(x, y, status = true){
        let fieldData = this.fields[y][x];
        let oldStatus = fieldData.status;
        fieldData.status = status;
        if(!oldStatus && fieldData.status) {
            fieldData.element.classList.add("ship");
        } else if(oldStatus && !fieldData.status){
            fieldData.element.classList.remove("ship");
        }
        this.update().then(() => {});
    }
    field_status(fields, x, y){
        if(x < 0 || x > this.w-1 || y < 0 || y > this.h-1) return false;
        return fields[y][x].status;
    }
    ship_length(fields, x, y){
        let length = 0;
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
                this.setText("Warten auf Gegner..");
                break;
            case 3:
                this.setText("Gegnerische Flotte:");
                break;
            case 4:
                this.setText("Richte deine Kanonen aus!");
                break;
            case 5:
                this.setText("Sieg über die Gegnerische Flotte!", "gold");
                break;
            case 6:
                this.setText("Die Verlierer-Flotte", "red");
                break;
        }
        this.update().then(() => {});
    }
    placeShipsRandomly() {
        return new Promise(async function(resolve){
            while(await this.update()) {
                for (let y = 0; y < this.h; y++) {
                    for (let x = 0; x < this.w; x++) {
                        this.setField(x, y, false);
                    }
                }
                for (const ship in this.ship_types) {
                    let count = this.ship_types[ship].count;
                    while (count > 0) {
                        let shipLength = parseInt(ship);
                        let shipPlaced = false;
                        while (!shipPlaced) {
                            let orientation = Math.floor(Math.random() * 2);
                            let x = Math.floor(Math.random() * this.w);
                            let y = Math.floor(Math.random() * this.h);
                            let positions = [];
                            let valid = true;
                            for (let i = 0; i < shipLength; i++) {
                                let posX = orientation ? x : x + i;
                                let posY = orientation ? y + i : y;
                                if (posX >= this.w || posY >= this.h || !this.checkField(posX, posY)) {
                                    valid = false;
                                    break;
                                } else {
                                    positions.push({x: posX, y: posY});
                                }
                            }
                            if (valid) {
                                for (const position of positions) {
                                    this.setField(position.x, position.y, true);
                                }
                                shipPlaced = true;
                            }
                        }
                        count--;
                    }
                }
            }
            resolve(true);
        }.bind(this));
    }
    hit_random(){
        let free_fields = [];
        for(let y = 0; y < this.h; y++) {
            for (let x = 0; x < this.w; x++) {
                if (!this.fields[y][x].beaten) {
                    if(this.checkField(x, y)) {
                        free_fields.push({x: x, y: y});
                    }
                }
            }
        }
        if(free_fields.length === 0) return false;
        return free_fields[Math.floor(Math.random()*free_fields.length)];
    }
    scan_ships(){
        let ships = {};
        for(let y = 0; y < this.h; y++) {
            for (let x = 0; x < this.w; x++) {
                if(this.field_status(this.fields, x, y)){
                    let length = this.ship_length(this.fields, x, y)-1;
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
        return new Promise(function(resolve){
            setTimeout(function(){
                let PlacingError = false;
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
                        PlacingError = true;
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
                        if(this.fields[y][x].beaten && !this.fields[y][x].element.classList.contains("beaten")){
                            this.fields[y][x].element.classList.add("beaten");
                        }
                        if(!this.fields[y][x].beaten && this.fields[y][x].element.classList.contains("beaten")){
                            this.fields[y][x].element.classList.remove("beaten");
                        }
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
                            let new_src = "images/gameAssets/"+teil+(this.fields[y][x].beaten ? "_dest" : "")+".png";
                            if(new_src !== this.fields[y][x].element.children[0].src) this.fields[y][x].element.children[0].src = new_src;
                            this.fields[y][x].element.children[0].style.transform = "rotate("+(rotation ? 90 : 0)+"deg)";
                        } else {
                            this.fields[y][x].element.children[0].style.display = "none";
                        }
                    }
                }
                resolve(PlacingError);
            }.bind(this), 20);
        }.bind(this));
    }
    update_field(data){
        for(let y = 0; y < data.length; y++) {
            for (let x = 0; x < data[y].length; x++) {
                if(!(y in this.fields)) continue;
                if(!(x in this.fields[y])) continue;

                this.fields[y][x].status = data[y][x].status;
                this.fields[y][x].beaten = data[y][x].beaten;
            }
        }
        this.update().then(() => {});
    }
    export(){
        let data = [];
        for(let y = 0; y < this.h; y++){
            let row_fields = [];
            for (let x = 0; x < this.w; x++) {
                row_fields.push({status: this.fields[y][x].status, beaten: this.fields[y][x].beaten});
            }
            data.push(row_fields);
        }
        return data;
    }
    won(){
        let won = true;
        for(let y = 0; y < this.h; y++) {
            for (let x = 0; x < this.w; x++) {
                if (this.fields[x][y].status && !this.fields[x][y].beaten) won = false;
            }
        }
        return won;
    }
}
class GegnerServer {
    constructor() {
        this.id = Math.random().toString()+Math.random().toString()+Math.random().toString();
        this.next_hit = false;
        this.start = new Date();
        this.mode = "online";
        this.update();
    }
    request(data) {
        const formData = new FormData();
        Object.keys(data).forEach(key => formData.append(key, data[key]));

        document.getElementById("game_info_text").style.color = "white";

        let error_timeout = setTimeout(function(){
            if(document.getElementById("game_info_text")) {
                document.getElementById("game_info_text").style.color = "red";
                document.getElementById("game_info_text").innerText = "Serververbindung fehlgeschlagen!";
                my_field.setStatus(1);
                gegner_field.setStatus(3);
            }
        }, 5000);

        return new Promise(function(resolve) {
            function run() {
                let xhr = new XMLHttpRequest();
                xhr.open('POST', 'https://sinkships.com/ajax/game.php');
                xhr.onload = function () {
                    if (xhr.status === 200) {
                        try {
                            clearTimeout(error_timeout);
                            resolve(JSON.parse(xhr.responseText));
                        } catch(e){
                            console.log(e);
                            setTimeout(run, 100);
                        }
                    } else {
                        setTimeout(run, 100);
                    }
                };
                xhr.onerror = function () {
                    setTimeout(run, 100);
                };
                xhr.send(formData);
            }
            run();
        }.bind(this));
    }
    update(){
        let hit = this.next_hit;
        this.next_hit = false;

        if(this.mode === "online") {
            this.request({
                id: this.id,
                version: my_field.gv,
                action: hit ? "hit" : "update",
                my_field: JSON.stringify(my_field.export()),
                hitX: hit ? hit.x : false,
                hitY: hit ? hit.y : false
            }).then(async function (data) {
                if (data.id !== this.id) {
                    console.error("Invalid Player ID!");
                    if (document.getElementById("game_info_text")) document.getElementById("game_info_text").innerText = "Verbindungsfehler!";
                } else {
                    if (document.getElementById("game_info_text")) document.getElementById("game_info_text").innerText = data.info_message;

                    my_field.setStatus(data.my_status);
                    gegner_field.setStatus(data.gegner_status);

                    my_field.update_field(data.my_field);
                    gegner_field.update_field(data.gegner_field);

                    if(data.gegner_status === 2 && new Date()-this.start > 4000 && new Date()-this.start < 10000 && my_field.gv === 0){
                        this.mode = "offline";
                        this.dran = true;
                        this.v = {
                            "my_field": new GameField(0, my_field.w, my_field.h, my_field.ship_types, my_field.gv),
                            "gegner_field": new GameField(3, my_field.w, my_field.h, my_field.ship_types, my_field.gv)
                        };
                        this.v.my_field.full_container.style.display = "none";
                        this.v.gegner_field.full_container.style.display = "none";
                        await this.v.my_field.placeShipsRandomly();
                        this.v.my_field.setStatus(1);
                    }
                }
                setTimeout(this.update.bind(this), 50);
            }.bind(this));
        } else if(this.mode === "offline"){
            if(this.dran && hit){
                if(!this.v.my_field.field_status(this.v.my_field.fields, hit.x, hit.y)) this.dran = false;
                this.v.my_field.fields[hit.y][hit.x].beaten = true;
                gegner_field.fields[hit.y][hit.x].beaten = true;
                gegner_field.fields[hit.y][hit.x].status = this.v.my_field.fields[hit.y][hit.x].status;

                if(!this.dran){
                    setTimeout(function(){
                        if(this.dran) return;
                        let weiter = true;
                        while(weiter) {
                            let field = this.v.gegner_field.hit_random();
                            if (!field) break;
                            if (!my_field.field_status(this.v.gegner_field.fields, field.x, field.y)) weiter = false;
                            my_field.fields[field.y][field.x].beaten = true;
                            this.v.gegner_field.fields[field.y][field.x].beaten = true;
                            this.v.gegner_field.fields[field.y][field.x].status = my_field.fields[field.y][field.x].status;
                        }
                        this.dran = true;
                    }.bind(this), Math.random() > 0.1 ? Math.random()*500 : Math.random()*1000);
                }
            }
            if(this.v.my_field.won()){
                this.dran = false;
                if (document.getElementById("game_info_text")) document.getElementById("game_info_text").innerText = "Du hast Gewonnen!";

                my_field.setStatus(1);
                gegner_field.setStatus(5);
            } else if(my_field.won()){
                this.dran = false;
                if (document.getElementById("game_info_text")) document.getElementById("game_info_text").innerText = "Dein Gegner hat gewonnen!";

                my_field.setStatus(6);
                gegner_field.setStatus(3);
            } else if(this.dran){
                if (document.getElementById("game_info_text")) document.getElementById("game_info_text").innerText = "Du bist dran!";

                my_field.setStatus(1);
                gegner_field.setStatus(4);
            } else {
                if (document.getElementById("game_info_text")) document.getElementById("game_info_text").innerText = "Dein Gegner ist dran!";

                my_field.setStatus(1);
                gegner_field.setStatus(3);
            }

            setTimeout(this.update.bind(this), 50);
        } else {
            console.log("Error: Invalid mode!");
        }
    }
    hit(x, y){
        this.next_hit = {x: x, y: y};
    }
}

window.start_game = function(){
    if(document.getElementsByClassName("leftbox")[0]) document.getElementsByClassName("leftbox")[0].remove();
    if(document.getElementsByClassName("rightbox")[0]) document.getElementsByClassName("rightbox")[0].style.width = "100%";

    if(document.getElementById("game_info_text")) document.getElementById("game_info_text").style.display = "block";

    my_field.setStatus(1);

    window.gegner_field = new GameField(2, my_field.w, my_field.h, my_field.ship_types, my_field.gv);

    if(document.getElementById("game_info_text")) document.getElementById("game_info_text").innerText = "Verbinden mit Server..";

    window.Server = new GegnerServer();
};