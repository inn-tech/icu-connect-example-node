
const img_result = document.getElementById('icu-result'); 
const img_stream = document.getElementById('icu-stream');     
const div_result = document.getElementById('result');
const age_panel = document.getElementById('age-panel');
const db_panel = document.getElementById('db-panel');
const img_database = document.getElementById('img-database');
const age_text = document.getElementById('age-result');
const id_text = document.getElementById('id-result');

var last_uid = ''

const age_threshold = 25
const display_row_count = 8
var rowCount = 0;
var inSession = false


function addHistory(result)
{
    if(rowCount >= display_row_count){
        $('#history').find('tbody').empty();
        rowCount = 0;        
    }

    var res_img = './content/images/pass.jpg'
    if(result.data.estimated_age <= age_threshold){
        res_img = './content/images/fail.jpg';
    }
    
    
    var row = '<tr>';
    row += '<td>' + new Date().toLocaleTimeString() +  '</td>';
    row += '<td><img width="60" height="60" src="data:image/png;base64,'+ result.data.captured_image + '" /></td>';  
    row += '<td><img width="60" height="60" src="' + res_img + '" /></td>';    

    if(result.cmd == 'no_id'){
        row += '<td><button class="btn btn-warning" id="enroll-bttn_"' + rowCount + ' onclick="enroll_id(' + rowCount + ')">Enroll</button></td>';  
        row += '<td><input type="hidden" id="f_'+ rowCount + '"  value="' +  result.data.feature + '" /></td>';
        row += '<td><input type="hidden" id="i_' + rowCount + '" value="' +  result.data.captured_image + '" /></td>';        
        
    }else{
        row += '<td><img width="60" height="60" src="data:image/png;base64,'+ result.data.database_image + '" /></td>';            
        last_uid = result.data.uid
    }
    row += '</tr>';


    $('#history').find('tbody').append(row);    

    rowCount++;

}


function enroll_id(r_id)
{

    var postData = {
        'feature':$('#f_' + r_id).val(),
        'image':$('#i_' + r_id).val()
    }

    $.ajax({
        url: '/',
        dataType: 'text',
        type: 'post',
        contentType: 'application/json',
        data: JSON.stringify(postData),
        success: function (data, textStatus, jQxhr) {
            console.log(data,textStatus,jQxhr)
        },
        error: function (jqXhr, textStatus, errorThrown) {
            console.log(jqXhr,textStatus,errorThrown)
        }
    });    




}





$(document).ready(function () {



     div_result.style.visibility = "hidden"
     age_panel.style.visibility = "hidden"     
     db_panel.style.visibility = "hidden"      
     

    const WS_URL = "ws://" + location.hostname + ":8080"
    const connection = new WebSocket(WS_URL);

    connection.onerror = (error) => {
        console.log(`WebSocket error: ${error}`)
    }

    connection.onopen = () => {
        console.log('WebSocket Client Connected');
    };

    connection.onmessage = (e) => {
        try {



        var msg = JSON.parse(e.data);

        if(inSession){
            if(msg['cmd'] === 'end_session'){
                img_stream.src = './content/images/back.jpg';     
                img_result.src = ''    
                div_result.style.visibility = "hidden"    
                age_panel.style.visibility = "hidden"   
                db_panel.style.visibility = "hidden"                                                                   
                inSession = false             
            }

            if(msg['cmd'] == 'id'){
                if(msg.data.estimated_age > age_threshold){
                    img_result.src = './content/images/pass.jpg'                         
                    age_text.innerHTML = 'age ok'
                }else{
                    img_result.src = './content/images/fail.jpg'     
                    age_text.innerHTML = 'age fail'                                  
                }
                img_database.src = 'data:image/png;base64,' + msg.data.database_image
                div_result.style.visibility = "visible"  
                age_panel.style.visibility = "visible"    
                db_panel.style.visibility = "visible"  
                id_text.innerHTML = 'ID known: ' + msg.data.uid
                
                addHistory(msg)                   
            }

            if(msg['cmd'] == 'no_id'){                    
                if(msg.data.estimated_age > age_threshold){
                    img_result.src = './content/images/pass.jpg'
                    age_text.innerHTML = 'age ok'
                }else{
                    img_result.src = './content/images/fail.jpg'                 
                    age_text.innerHTML = 'age fail'                    
                }            
                div_result.style.visibility = "visible"               
                age_panel.style.visibility = "visible"  
                db_panel.style.visibility = "hidden"    
                id_text.innerHTML = 'ID unknown'
                addHistory(msg)                

            }

        }else{
            if(msg['cmd'] === 'start_session'){
                img_stream.src = 'http://192.168.137.8:8040/stream';  
                inSession = true
            }            
        }
        } catch (error) {
        console.log(error);
        }
    }

});

