(function($){
    ParticleTheme = function(els){};
    ParticleTheme.prototype.render=function(els, parent){
        if(els.constructor===Array){
            var output=[];
            for(var e in els){
                output.push(this.render(els[e]));
            }
            return output;
        }
        if(typeof els === 'object'){
            this.postProcess=[];
            if(this[els._type]){
                var output=this[els._type](els);
            }else{
                var output=this.renderTag(els);
            }
            if(isset(parent)) parent.append(output);
            if(this.postProcess.length>-1){
                $.each(this.postProcess, function(k,v){
                    v();
                });
            }
        }
        
        output.trigger('create');
        return output;
    };
    
    //Render generic html tag
    ParticleTheme.prototype.renderTag=function(vals, key){
        var tag=$('<'+vals._type+'></'+vals._type+'>');
        for(var i in vals){
            switch(vals[i].constructor){
                case Object:
                    if(i=='events'){
                        tag.on(vals[i]);
                    }else if(i=='css'){
                        tag.css(vals[i]);
                    }else{
                        if(this[vals[i]._type]){
                            tag.append(this[vals[i]._type](vals[i], i));
                        }else{
                            tag.append(this.renderTag(vals[i], i));
                        }
                    }
                    break;
                case  Array:
                    if(i=='classes'){
                        tag.addClass(vals[i].join(' '));
                    }
                    break;
                default:
                    if(i==='_content'){
                        tag.html(vals[i]);
                    }else if(i[0]!=='_'){
                        tag.attr(i, vals[i]);
                    }
            }
        }
        return tag;
    };
    
    //Form element render functions
    ParticleTheme.prototype.form=function(vals, key){
        var el={action: '', method: 'POST', events: {submit:this.formSubmit}};
        if(isset(key))
        $.extend(el, vals);
        return this.renderTag(el);
    };
    ParticleTheme.prototype.submit=function(vals, key){
        var el={value: 'Submit', type: 'submit'};
        $.extend(el, vals);
        return this.input(el, key);
    };
    ParticleTheme.prototype.password=function(vals, key){
        var el={type: 'password'};
        $.extend(el, vals);
        console.log('password');
        return this.input(el, key);
    };
    ParticleTheme.prototype.input=function(vals, key){
        var el={type: 'text', id: key, name: key};
        
        if(!isset(el.name) && isset(el.id)) el.name=el.id;
        if(!isset(el.id) && isset(el.name)) el.id=el.name;
        $.extend(el, vals);
        el._type='input';
        if(isset(vals._label)){
            var label=this.renderTag({_type:'label', _content:vals._label});
            label.append(this.renderTag(el));
            return label;
        }else{
            return this.renderTag(el);
        }
    };
    
    //jQuery mobile elements
    ParticleTheme.prototype.collapsibleLi=function(vals){
        var el={'data-role':'collapsible', 'data-iconpos':"right", 'data-shadow':"false", 'data-corners': "false", classes:['ui-collapsible', 'ui-collapsible-inset', 'ui-collapsible-themed-content', 'ui-collapsible-collapsed']};
        $.extend(el, vals);
        el._type='li';
        var tag=this.renderTag(el);
        this.postProcess.push(function(){
            tag.collapsible({refresh : true});
        });
        return tag;
    };
    ParticleTheme.prototype.listview=function(vals){
        var el={"data-role":'listview'};
        $.extend(el, vals);
        el._type='ul';
        var tag=this.renderTag(el);
        this.postProcess.push(function(){
            tag.listview();
        });
        return tag;
    };
})(jQuery);
