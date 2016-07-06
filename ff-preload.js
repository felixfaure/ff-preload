;(function(){
	'use strict';

	// Support of addEventListener ?
	var hasNative = 'addEventListener' in (new Image());

	// images : array of string of images to load, options : object of options
	var FFpreloader = function(images, options){
		this.options = {
			pipeline: false,
			auto: true,
			prefetch: false,
			/* onProgress: function(){}, */
			/* onError: function(){}, */
			onComplete: function(){}
		};

		options && typeof options == 'object' && this.setOptions(options);

		this.addQueue(images);
		this.queue.length && this.options.auto && this.processQueue();
	};

	//Options
	FFpreloader.prototype.setOptions = function(options){
		// shallow copy
		var o = this.options,
        key;

		for (key in options) options.hasOwnProperty(key) && (o[key] = options[key]);

		return this;
	};

	//Store array
	FFpreloader.prototype.addQueue = function(images){
		this.queue = images.slice();

		return this;
	};

	//Reset the array
	FFpreloader.prototype.reset = function(){
		this.completed = [];
		this.errors = [];

		return this;
	};

	//Listen events
	FFpreloader.prototype._addEvents = function(image, src, index){
		var self = this,
        o = this.options,
        cleanup = function(){
        	if (hasNative){
        		this.removeEventListener('error', abort);
        		this.removeEventListener('abort', abort);
        		this.removeEventListener('load', load);
        	}
        	else {
        		this.onerror = this.onabort = this.onload = null;
        	}
        },
        abort = function(){
        	cleanup.call(this);

        	self.errors.push(src);
        	o.onError && o.onError.call(self, src);
        	_checkProgress.call(self, src);
        	o.pipeline && self._loadNext(index);
        },
        load = function(){
        	cleanup.call(this);

        	// store progress. this === image
        	self.completed.push(src); // this.src may differ
        	_checkProgress.call(self, src, this);
        	o.pipeline && self._loadNext(index);
        };

		if (hasNative){
			image.addEventListener('error', abort, false);
			image.addEventListener('abort', abort, false);
			image.addEventListener('load', load, false);
		}
		else {
			image.onerror = image.onabort = abort;
			image.onload = load;
		}

		return this;
	};

	//Load an image
	FFpreloader.prototype._load = function(src, index){
		var image = new Image();

		this._addEvents(image, src, index);

		// actually load
		image.src = src;

		return this;
	};

	//Load the next image (if pipeline is enable)
	FFpreloader.prototype._loadNext = function(index){
		index++;
		this.queue[index] && this._load(this.queue[index], index);

		return this;
	};

	//Iterates through the queue of images to load
	FFpreloader.prototype.processQueue = function(){
		// runs through all queued items.
		var i = 0,
        queue = this.queue,
        len = queue.length;

		// process all queue items
		this.reset();

		if (!this.options.pipeline) for (; i < len; ++i) this._load(queue[i], i);
		else this._load(queue[0], 0);

		return this;
	};

  //Check
	function _checkProgress(src, image){
		var args = [],
        o = this.options;

		// call onProgress
		o.onProgress && src && o.onProgress.call(this, src, image, this.completed.length + this.errors.length, this.queue.length);

		if (this.completed.length + this.errors.length === this.queue.length){
			args.push(this.completed);
			this.errors.length && args.push(this.errors);
			o.onComplete.apply(this, args);
		}

		return this;
	}

	this.ffpreloader = FFpreloader;
}).call(this);
